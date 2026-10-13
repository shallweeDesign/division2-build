/**
 * 使用者資料 / Everything the site keeps for one player: language, collectible
 * progress and saved builds.
 *
 * Local first. The data always lives in this browser (localStorage), and the
 * pages read and write only this module. When the player signs in,
 * `cloud/sync.ts` mirrors the same object to their Firestore document and
 * applies changes made in other browsers back here — the pages never know
 * whether a change came from a click or from another device.
 *
 * Storage can be missing or throw (private mode, blocked site data); every
 * access is guarded, and the site works for the session without it.
 */
import type { BuildState } from '../model/build.ts';

export interface SavedBuild {
  id: string;
  name: string;
  build: BuildState;
  /** ms since epoch; the newer copy wins when two browsers merge. */
  updatedAt: number;
}

export interface UserData {
  v: 1;
  lang: 'zh-tw' | 'en' | null;
  /** Collection id → the location numbers ticked as found. */
  collectibles: Record<string, number[]>;
  builds: SavedBuild[];
}

/** 上限 / Kept well inside Firestore's 1 MB document limit. */
export const MAX_BUILDS = 50;

const KEY = 'd2b.user';

export const emptyUserData = (): UserData => ({ v: 1, lang: null, collectibles: {}, builds: [] });

const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null =
  typeof localStorage === 'undefined' ? null : localStorage;

function read(key: string): string | null {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

/** 整理 / Coerce anything stored or synced into a well-formed `UserData`. */
export function normalizeUserData(raw: unknown): UserData {
  const out = emptyUserData();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<UserData>;
  if (r.lang === 'zh-tw' || r.lang === 'en') out.lang = r.lang;
  if (r.collectibles && typeof r.collectibles === 'object') {
    for (const [id, list] of Object.entries(r.collectibles)) {
      if (Array.isArray(list)) out.collectibles[id] = [...new Set(list.filter((n) => Number.isInteger(n)))].sort((a, b) => a - b);
    }
  }
  if (Array.isArray(r.builds)) {
    out.builds = r.builds
      .filter((b): b is SavedBuild => !!b && typeof b.id === 'string' && typeof b.name === 'string' && !!b.build)
      .map((b) => ({ id: b.id, name: b.name.slice(0, 60), build: b.build, updatedAt: Number(b.updatedAt) || 0 }))
      .slice(0, MAX_BUILDS);
  }
  return out;
}

/**
 * 舊資料 / Before this module, the language and each collection's progress
 * had keys of their own. Fold them in once so nobody loses their ticks.
 */
function migrate(data: UserData): UserData {
  const lang = read('d2b.lang');
  if (!data.lang && (lang === 'zh-tw' || lang === 'en')) data.lang = lang;
  try {
    for (let i = 0; storage && i < (storage as Storage).length; i++) {
      const k = (storage as Storage).key(i);
      const m = k && /^d2b\.collect\.(.+)$/.exec(k);
      if (!m || data.collectibles[m[1]!]) continue;
      const list = JSON.parse(read(k!) ?? '[]') as unknown;
      if (Array.isArray(list)) data.collectibles[m[1]!] = list.filter((n) => Number.isInteger(n));
    }
  } catch { /* nothing to migrate */ }
  return data;
}

let data: UserData = (() => {
  let parsed: unknown = null;
  try { parsed = JSON.parse(read(KEY) ?? 'null'); } catch { /* corrupt: start clean */ }
  return migrate(normalizeUserData(parsed));
})();

type Source = 'local' | 'cloud';
type Listener = (data: UserData, source: Source) => void;
const listeners = new Set<Listener>();

export const userData = (): UserData => data;

export function onUserData(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next: UserData, source: Source) {
  data = next;
  try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* session only */ }
  for (const fn of listeners) fn(data, source);
}

/** 本機修改 / A change made on this page. Synced up if signed in. */
export function updateUserData(fn: (d: UserData) => void) {
  const next = structuredClone(data);
  fn(next);
  commit(normalizeUserData(next), 'local');
}

/** 雲端套用 / A change that arrived from the player's account. */
export function replaceUserData(next: unknown) {
  commit(normalizeUserData(next), 'cloud');
}

/** 清除 / Forget everything in this browser, e.g. on sign-out. */
export function clearUserData() {
  commit(emptyUserData(), 'local');
}

/**
 * 合併 / Fold this browser's data into the account's on first sign-in here:
 * ticks are unioned, builds are unioned by id with the newer copy winning,
 * and the account's language wins if it has one.
 */
export function mergeUserData(local: UserData, cloud: UserData): UserData {
  const out = emptyUserData();
  out.lang = cloud.lang ?? local.lang;
  for (const id of new Set([...Object.keys(local.collectibles), ...Object.keys(cloud.collectibles)])) {
    out.collectibles[id] = [...new Set([...(local.collectibles[id] ?? []), ...(cloud.collectibles[id] ?? [])])]
      .sort((a, b) => a - b);
  }
  const byId = new Map<string, SavedBuild>();
  for (const b of [...cloud.builds, ...local.builds]) {
    const prev = byId.get(b.id);
    if (!prev || b.updatedAt > prev.updatedAt) byId.set(b.id, b);
  }
  out.builds = [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_BUILDS);
  return out;
}

export const newBuildId = () =>
  `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
