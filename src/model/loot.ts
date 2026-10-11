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
    note: str(r.snapshot_note),
  };
}

/**
 * 每日重置 / The game's daily reset, 08:00 UTC, which is when the targeted loot
 * rotates.
 *
 * Not taken from the source's `next_expected_update`: that says "Around 07:00
 * UTC", but its own commit history shows the 07:05 check still carrying the
 * previous day and the new date first appearing at 08:05, on 2026-10-10 and
 * 2026-10-11 alike. Its `last_updated` is not UTC either (10:01 for an 08:0x
 * change), so neither field is used for timing.
 */
export const DAILY_RESET_UTC_HOUR = 8;

const HOUR_MS = 3600 * 1000;

/** 輪替日 / The rotation `now` falls in, named by the UTC date it began on. */
export const rotationDate = (now = new Date()) =>
  new Date(now.getTime() - DAILY_RESET_UTC_HOUR * HOUR_MS).toISOString().slice(0, 10);

/**
 * 是否過期 / The snapshot predates the current rotation. Right after a reset
 * the source takes a few minutes to catch up, so this is briefly true then —
 * which is accurate: the list on screen is yesterday's until it does.
 */
export const isStale = (snap: LootSnapshot, now = new Date()) => snap.date < rotationDate(now);

/** 下次重置 / The next daily reset after `now`. */
export function nextReset(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RESET_UTC_HOUR));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** 本地時鐘 / `HH:MM` on the reader's own clock. */
export const localClock = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 本地日期 / `YYYY-MM-DD` on the reader's own calendar. */
export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
