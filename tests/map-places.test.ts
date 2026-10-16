/** 地圖地點 / The map's pins: complete, unique, and inside D.C. */
import { describe, expect, it } from 'vitest';
import { ALTARS, MISSIONS, RED_MOON, STRONGHOLDS } from '../src/data/map/places.ts';

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
});
