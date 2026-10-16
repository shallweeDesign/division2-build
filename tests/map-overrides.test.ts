/** 地圖位置修正 / Corrections: cleaned on the way in, laid over the defaults. */
import { describe, expect, it } from 'vitest';
import {
  AREA_KEY, applyOverrides, decodeRest, emptyOverrides, encodeOverrides, normalizeOverrides,
} from '../src/data/map/overrides.ts';
import { ALTARS, DISTRICTS, GAME_AREA } from '../src/data/map/places.ts';

describe('map overrides', () => {
  it('keeps known pins inside the bounds and drops the rest', () => {
    const ov = normalizeOverrides({
      pins: { 'altar-1': [-77.05, 38.9], 'altar-2': [0, 0], nope: [-77.05, 38.9], 'altar-3': 'x' },
    });
    expect(ov.pins).toEqual({ 'altar-1': [-77.05, 38.9] });
  });

  it('reads flat or nested rings, but only closed ones of four points or more', () => {
    const ring = DISTRICTS[0]!.ring;
    const ov = normalizeOverrides({
      rings: { [DISTRICTS[0]!.name]: ring.flat(), [AREA_KEY]: GAME_AREA, 'Unknown': ring.flat(), 'White House': ring.slice(0, 3).flat() },
    });
    expect(Object.keys(ov.rings).sort()).toEqual([AREA_KEY, DISTRICTS[0]!.name].sort());
  });

  it('round-trips through the stored shape', () => {
    const ov = { pins: { 'altar-5': [-77.051, 38.8962] as [number, number] }, rings: { [AREA_KEY]: GAME_AREA } };
    expect(normalizeOverrides(encodeOverrides(ov))).toEqual(ov);
  });

  it('decodes a Firestore REST document', () => {
    const doc = {
      fields: {
        pins: { mapValue: { fields: { 'altar-1': { arrayValue: { values: [{ doubleValue: -77.05 }, { doubleValue: 38.9 }] } } } } },
        rings: { mapValue: {} },
        updatedAt: { timestampValue: '2026-10-16T00:00:00Z' },
      },
    };
    expect(decodeRest(doc)).toEqual({ pins: { 'altar-1': [-77.05, 38.9] }, rings: {} });
  });

  it('lays corrections over the defaults and leaves the rest alone', () => {
    const cur = applyOverrides({ ...emptyOverrides(), pins: { 'altar-1': [-77.05, 38.9] } });
    expect(cur.altars[0]).toMatchObject({ id: 'altar-1', lng: -77.05, lat: 38.9 });
    expect(cur.altars[1]).toEqual(ALTARS[1]);
    expect(cur.area).toBe(GAME_AREA);
  });
});
