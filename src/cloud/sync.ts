/**
 * 帳號同步 / Google sign-in, and keeping `user-data.ts` in step with the
 * player's Firestore document across browsers.
 *
 * The Firebase SDK is large, so it is never part of a page's first load. It
 * is fetched when the player presses "Sign in", or straight away on a page
 * load in a browser that was signed in last time (a flag in localStorage).
 * A visitor who never signs in never downloads it.
 *
 * On sign-in in a browser not yet linked to this account, its local data is
 * merged into the account's (nothing ticked here is lost). After that the
 * account is the source of truth: changes made here are written up, and
 * changes from other browsers arrive through a live listener.
 */
import { FIREBASE_CONFIG } from './config.ts';
import {
  clearUserData, mergeUserData, normalizeUserData, onUserData, replaceUserData, userData,
} from './user-data.ts';

export type CloudStatus = 'off' | 'signed-out' | 'loading' | 'signed-in' | 'error';

export interface CloudState {
  status: CloudStatus;
  user: { uid: string; name: string; email: string; photo: string | null } | null;
  /** Last error, for the header's tooltip. */
  error: string | null;
}

let state: CloudState = { status: FIREBASE_CONFIG ? 'signed-out' : 'off', user: null, error: null };
const listeners = new Set<(s: CloudState) => void>();

export const cloudState = () => state;
export const cloudEnabled = () => FIREBASE_CONFIG !== null;

export function onCloudState(fn: (s: CloudState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(next: Partial<CloudState>) {
  state = { ...state, ...next };
  for (const fn of listeners) fn(state);
}

const FLAG = 'd2b.cloud';          // "this browser was signed in"
const LINKED = 'd2b.cloud.uid';    // "local data already belongs to this uid"

const flag = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* session only */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* nothing */ } },
};

type Sdk = Awaited<ReturnType<typeof loadSdk>>;
let sdk: Promise<Sdk> | null = null;

async function loadSdk() {
  const [{ initializeApp }, auth, store] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG!);
  return { auth, store, authInst: auth.getAuth(app), db: store.getFirestore(app) };
}

/** 載入 SDK 並開始監聽登入狀態 / Fetch the SDK once and wire up the listeners. */
function ensureSdk(): Promise<Sdk> {
  if (sdk) return sdk;
  sdk = loadSdk().then((s) => {
    s.auth.onAuthStateChanged(s.authInst, (u) => { void onUser(s, u); });
    return s;
  });
  sdk.catch((e: Error) => { sdk = null; set({ status: 'error', error: e.message }); });
  return sdk;
}

let stopSnapshot: (() => void) | null = null;
let stopLocal: (() => void) | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
/** Sends a batched change now rather than after the delay; set while signed in. */
let flush: (() => Promise<unknown>) | null = null;

async function onUser(s: Sdk, u: import('firebase/auth').User | null) {
  stopSnapshot?.(); stopSnapshot = null;
  stopLocal?.(); stopLocal = null;
  if (!u) {
    set({ status: 'signed-out', user: null });
    return;
  }
  set({ status: 'loading', user: { uid: u.uid, name: u.displayName ?? u.email ?? '', email: u.email ?? '', photo: u.photoURL }, error: null });

  const { doc, getDoc, setDoc, onSnapshot, serverTimestamp } = s.store;
  const ref = doc(s.db, 'users', u.uid);
  const write = (d: ReturnType<typeof userData>) =>
    setDoc(ref, { ...d, updatedAt: serverTimestamp() }).catch((e: Error) => set({ status: 'error', error: e.message }));

  try {
    const snap = await getDoc(ref);
    const cloud = snap.exists() ? normalizeUserData(snap.data()) : null;
    if (flag.get(LINKED) === u.uid && cloud) {
      replaceUserData(cloud);                       // already linked: account wins
    } else {
      const merged = cloud ? mergeUserData(userData(), cloud) : userData();
      replaceUserData(merged);
      await write(userData());
      flag.set(LINKED, u.uid);
    }
  } catch (e) {
    set({ status: 'error', error: (e as Error).message });
    return;
  }

  // Other browsers' changes. Our own writes echo back first with pending
  // writes; those are skipped so a fast typist is not overwritten mid-edit.
  stopSnapshot = onSnapshot(ref, (snap) => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    replaceUserData(snap.data());
  }, (e) => set({ status: 'error', error: e.message }));

  // This browser's changes, batched so a run of ticks is one write.
  stopLocal = onUserData((d, source) => {
    if (source !== 'local') return;
    if (writeTimer) clearTimeout(writeTimer);
    flush = () => { writeTimer = null; flush = null; return write(d); };
    writeTimer = setTimeout(() => { void flush?.(); }, 600);
  });

  set({ status: 'signed-in' });
}

/** 頁面啟動 / Call once per page. Resumes a previous session without a click. */
export function startCloud() {
  if (!FIREBASE_CONFIG) return;
  if (flag.get(FLAG)) {
    set({ status: 'loading' });
    void ensureSdk();
  }
}

export async function signIn() {
  if (!FIREBASE_CONFIG) return;
  set({ status: 'loading', error: null });
  try {
    const s = await ensureSdk();
    await s.auth.signInWithPopup(s.authInst, new s.auth.GoogleAuthProvider());
    flag.set(FLAG, '1');
  } catch (e) {
    const msg = (e as { code?: string }).code ?? (e as Error).message;
    // Closing the popup is a choice, not an error.
    set(msg === 'auth/popup-closed-by-user' || msg === 'auth/cancelled-popup-request'
      ? { status: 'signed-out' }
      : { status: 'error', error: msg });
  }
}

/**
 * 登出 / Sign out and forget this browser's copy: on a shared computer the
 * next person should not inherit your builds. The account keeps everything.
 */
export async function signOut() {
  // A change still waiting in the batch goes up first, or it would be lost.
  if (writeTimer) { clearTimeout(writeTimer); await flush?.(); }
  const s = await sdk;
  await s?.auth.signOut(s.authInst);
  flag.del(FLAG);
  flag.del(LINKED);
  clearUserData();
}

/**
 * 地圖位置修正 / Write the map's position corrections (`map/overrides`).
 * Only the owner's account may, per `firestore.rules`; anyone else gets
 * Firestore's permission-denied error back, which the editor shows.
 */
export async function saveMapOverrides(data: Record<string, unknown>) {
  const s = await sdk;
  if (!s || !s.authInst.currentUser) throw new Error('not-signed-in');
  const { doc, setDoc, serverTimestamp } = s.store;
  await setDoc(doc(s.db, 'map', 'overrides'), { ...data, updatedAt: serverTimestamp() });
}
