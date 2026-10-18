/**
 * 位置修正 / Corrections to the map's positions, made by dragging on the
 * position editor and kept in one Firestore document, `map/overrides`.
 *
 * The built-in positions (`places.ts`) stay the defaults; this document only
 * holds what was moved. Anyone may read it — the map page fetches it over
 * Firestore's REST API, so visitors never download the Firebase SDK — and
 * only the site owner's account may write it (`firestore.rules`).
 *
 * Stored shape (Firestore cannot nest arrays, so rings are flattened):
 *   pins:  { <place id>: [lng, lat] }
 *   rings: { <district name> | "__area": [lng, lat, lng, lat, …] }  (closed)
 */
import { FIREBASE_CONFIG } from '../../cloud/config.ts';
import { ALTARS, DISTRICTS, GAME_AREA, MAP_BOUNDS, MISSIONS, STRONGHOLDS } from './places.ts';
import type { District, MapPlace } from './places.ts';

export type LngLat = [number, number];
export const AREA_KEY = '__area';

export interface MapOverrides {
  pins: Record<string, LngLat>;
  rings: Record<string, LngLat[]>;
}

export const emptyOverrides = (): MapOverrides => ({ pins: {}, rings: {} });

const PLACE_IDS = new Set([...MISSIONS, ...STRONGHOLDS, ...ALTARS].map((p) => p.id));
const RING_KEYS = new Set([...DISTRICTS.map((d) => d.name), AREA_KEY]);

/** Inside the map's pan bounds; anything else is a typo or a mis-drag. */
const inBounds = ([lng, lat]: LngLat) =>
  Number.isFinite(lng) && Number.isFinite(lat)
  && lng >= MAP_BOUNDS[0][0] && lng <= MAP_BOUNDS[1][0] && lat >= MAP_BOUNDS[0][1] && lat <= MAP_BOUNDS[1][1];

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const point = (v: unknown): LngLat | null =>
  Array.isArray(v) && v.length === 2 && inBounds([Number(v[0]), Number(v[1])]) ? [round(Number(v[0])), round(Number(v[1]))] : null;

/**
 * 正規化 / Keep only known ids, points inside the bounds and closed rings of
 * four or more points. Accepts either stored flat rings or nested ones.
 */
export function normalizeOverrides(raw: unknown): MapOverrides {
  const out = emptyOverrides();
  const r = (raw ?? {}) as { pins?: Record<string, unknown>; rings?: Record<string, unknown> };
  for (const [id, v] of Object.entries(r.pins ?? {})) {
    const p = point(v);
    if (p && PLACE_IDS.has(id)) out.pins[id] = p;
  }
  for (const [key, v] of Object.entries(r.rings ?? {})) {
    if (!RING_KEYS.has(key) || !Array.isArray(v)) continue;
    const pairs: unknown[] = typeof v[0] === 'number'
      ? Array.from({ length: Math.floor(v.length / 2) }, (_, i) => [v[2 * i], v[2 * i + 1]])
      : v;
    const ring = pairs.map(point);
    if (ring.length < 4 || ring.some((p) => !p)) continue;
    const pts = ring as LngLat[];
    if (pts[0]![0] !== pts[pts.length - 1]![0] || pts[0]![1] !== pts[pts.length - 1]![1]) continue;
    out.rings[key] = pts;
  }
  return out;
}

/** 寫入格式 / The document as Firestore stores it: rings flattened. */
export const encodeOverrides = (ov: MapOverrides) => ({
  pins: ov.pins,
  rings: Object.fromEntries(Object.entries(ov.rings).map(([k, ring]) => [k, ring.flat()])),
});

/** 套用 / The places, districts and game area with the corrections laid on. */
export function applyOverrides(ov: MapOverrides) {
  const move = (p: MapPlace): MapPlace => {
    const at = ov.pins[p.id];
    return at ? { ...p, lng: at[0], lat: at[1] } : p;
  };
  return {
    missions: MISSIONS.map(move),
    strongholds: STRONGHOLDS.map(move),
    altars: ALTARS.map(move),
    districts: DISTRICTS.map((d): District => (ov.rings[d.name] ? { ...d, ring: ov.rings[d.name]! } : d)),
    area: ov.rings[AREA_KEY] ?? GAME_AREA,
  };
}

/** Firestore REST 的值 / One typed value from the REST API, as plain JSON. */
function fromRest(v: Record<string, unknown>): unknown {
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('stringValue' in v) return v.stringValue;
  if ('arrayValue' in v) return ((v.arrayValue as { values?: Record<string, unknown>[] }).values ?? []).map(fromRest);
  if ('mapValue' in v) {
    const f = (v.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    return Object.fromEntries(Object.entries(f).map(([k, x]) => [k, fromRest(x)]));
  }
  return null;
}

export const decodeRest = (doc: { fields?: Record<string, Record<string, unknown>> }) =>
  normalizeOverrides(fromRest({ mapValue: { fields: doc.fields ?? {} } }));

/**
 * 讀取 / Fetch the corrections. No document yet, no network, or Firebase off
 * all mean the same thing to the page: use the built-in positions.
 */
export async function loadMapOverrides(): Promise<MapOverrides> {
  if (!FIREBASE_CONFIG) return emptyOverrides();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}`
    + `/databases/(default)/documents/map/overrides?key=${FIREBASE_CONFIG.apiKey}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return emptyOverrides();
    return decodeRest(await res.json());
  } catch {
    return emptyOverrides();
  }
}
