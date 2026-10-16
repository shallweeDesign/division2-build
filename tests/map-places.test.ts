/** 地圖地點 / The map's pins: complete, unique, and inside D.C. */
import { describe, expect, it } from 'vitest';
import { ALTARS, DISTRICTS, GAME_AREA, MISSIONS, RED_MOON, STRONGHOLDS, inRing, splitAtJunctions } from '../src/data/map/places.ts';

const all = [...MISSIONS, ...STRONGHOLDS, ...ALTARS];

describe('map places', () => {
  it('has unique ids', () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });

  it('keeps every pin within reach of D.C.', () => {
    for (const p of all) {
      expect(p.lat, p.id).toBeGreaterThan(38.86);
      expect(p.lat, p.id).toBeLessThan(38.94);
      expect(p.lng, p.id).toBeGreaterThan(-77.07);
      expect(p.lng, p.id).toBeLessThan(-77.0);
    }
  });

  it('lists the 20 Red Moon altars in order, all approximate, with directions', () => {
    expect(ALTARS.map((p) => p.id)).toEqual(Array.from({ length: 20 }, (_, i) => `altar-${i + 1}`));
    for (const p of ALTARS) {
      expect(p.precision, p.id).toBe('approx');
      expect(p.where?.zh, p.id).toBeTruthy();
      expect(p.where?.en, p.id).toBeTruthy();
    }
    expect(RED_MOON.start < RED_MOON.end).toBe(true);
  });

  it('names the missions the way the loot snapshot does', () => {
    // As they appear in Raigulus' escalation rotation, 2026-10-15.
    for (const name of ['ViewPoint Museum', 'Jefferson Trade Center', 'Bank Headquarters', 'DCD Headquarters']) {
      expect(MISSIONS.some((p) => p.en === name), name).toBe(true);
    }
  });

  it('puts every pin inside its own district, where that district is drawn', () => {
    for (const p of all) {
      const d = DISTRICTS.find((x) => x.name === p.district);
      if (!d) continue; // Roosevelt Island, the outskirts, the Pentagon: not drawn
      expect(inRing([p.lng, p.lat], d.ring), `${p.id} in ${p.district}`).toBe(true);
      for (const other of DISTRICTS.filter((x) => x !== d)) {
        expect(inRing([p.lng, p.lat], other.ring), `${p.id} also in ${other.name}`).toBe(false);
      }
    }
  });

  it('closes every district ring', () => {
    for (const d of DISTRICTS) expect(d.ring[0], d.name).toEqual(d.ring[d.ring.length - 1]);
  });

  it('shares every corner that lies on another district edge', () => {
    // A corner on an edge is a T-junction; after splitting there are none.
    const rings = [...DISTRICTS.map((d) => d.ring), GAME_AREA];
    expect(splitAtJunctions(rings)).toEqual(rings);
    const wpp = DISTRICTS.find((d) => d.name === 'West Potomac Park')!;
    expect(wpp.ring.length).toBeGreaterThan(5);
  });

  it('splits an edge at a corner lying on it, in order', () => {
    const square: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
    const tick: [number, number][] = [[1, 0], [1, -1], [1.5, -1], [1, 0]];
    expect(splitAtJunctions([square, tick])[0]).toEqual([[0, 0], [1, 0], [2, 0], [2, 2], [0, 2], [0, 0]]);
  });
});
