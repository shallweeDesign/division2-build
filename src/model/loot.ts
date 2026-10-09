/**
 * 每日戰利品 / Today's targeted loot, as published by Raigulus.
 *
 * https://raigulus.github.io/division-2/loot/ re-checks the rotation a few
 * times a day and writes the result to a small JSON file, served with
 * `Access-Control-Allow-Origin: *`. The page reads that file live rather than
 * baking it in: it changes daily, and a copy in the bundle would be stale by
 * the next morning.
 *
 * Nothing here trusts the shape. The file belongs to someone else and can
 * change without notice, so `parseLoot` keeps what it recognises and returns
 * null when the core of it — the date and the mission list — is gone.
 */

export const LOOT_URL = 'https://raigulus.github.io/assets/data/escalation-target-loot.json';
export const LOOT_PAGE = 'https://raigulus.github.io/division-2/loot/';

const TIMEOUT_MS = 8000;

export interface LootMission { mission: string; loot: string }
export interface VendorCache { type: string; item: string }

export interface LootSnapshot {
  /** The rotation's own date, `YYYY-MM-DD`. */
  date: string;
  rotation: string;
  missions: LootMission[];
  vendorCaches: VendorCache[];
  /** `ok` when the source considers today's snapshot current. */
  status: string;
  lastChecked: string;
  nextExpectedUpdate: string;
  note: string;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** 驗證並整理 / Keep the parts we recognise; null if the core is missing. */
export function parseLoot(raw: unknown): LootSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const date = str(r.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(r.missions)) return null;

  const missions = r.missions
    .map((m) => ({ mission: str(m?.mission), loot: str(m?.loot) }))
    .filter((m) => m.mission && m.loot);
  if (!missions.length) return null;

  const vendorCaches = (Array.isArray(r.vendor_caches) ? r.vendor_caches : [])
    .map((c) => ({ type: str(c?.type), item: str(c?.item) }))
    .filter((c) => c.type && c.item);

  return {
    date,
    rotation: str(r.rotation),
    missions,
    vendorCaches,
    status: str(r.status),
    lastChecked: str(r.last_checked) || str(r.last_updated),
    nextExpectedUpdate: str(r.next_expected_update),
    note: str(r.snapshot_note),
  };
}

/**
 * 是否過期 / The snapshot is for a day other than today (UTC). The source
 * rolls over around 07:00 UTC, so in the hours before that yesterday's list is
 * still the live one — this flags it rather than hiding it.
 */
export const isStale = (snap: LootSnapshot, now = new Date()) =>
  snap.date !== now.toISOString().slice(0, 10);

/**
 * 換算本地時間 / Turn the first `HH:MM UTC` in a phrase into the reader's
 * local clock time, e.g. "Around 07:00 UTC" → "15:00" in Taipei. Null when the
 * phrase carries no such time.
 */
export function utcPhraseToLocal(phrase: string, now = new Date()): string | null {
  const m = /(\d{1,2}):(\d{2})\s*UTC/i.exec(phrase);
  if (!m) return null;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Number(m[1]), Number(m[2])));
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

let cached: Promise<LootSnapshot | null> | null = null;

/**
 * 抓取 / Fetch once per page load and share the promise, so switching tabs
 * back and forth does not refetch. A failure is not cached: `retry` clears it.
 */
export function loadLoot(url = LOOT_URL): Promise<LootSnapshot | null> {
  if (cached) return cached;
  cached = (async () => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: abort.signal, cache: 'no-store' });
      if (!res.ok) return null;
      return parseLoot(await res.json());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  void cached.then((snap) => { if (!snap) cached = null; });
  return cached;
}
