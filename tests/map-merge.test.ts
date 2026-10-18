/** 合併鄰近錨點 / Nearby corners collapse onto the shared one; rings stay valid. */
import { describe, expect, it } from 'vitest';
import { mergeNearby, metres } from '../src/data/map/merge.ts';
import type { LngLat } from '../src/data/map/merge.ts';

// ~4.4 m east of x at D.C.'s latitude.
const NUDGE = 0.00005;

describe('mergeNearby', () => {
  it('measures metres at D.C. scale', () => {
    expect(metres([-77.03, 38.9], [-77.03 + NUDGE, 38.9])).toBeGreaterThan(4);
    expect(metres([-77.03, 38.9], [-77.03 + NUDGE, 38.9])).toBeLessThan(5);
  });

  it('moves a stray corner onto the corner more rings share', () => {
    const shared: LngLat = [-77.03, 38.9];
    const stray: LngLat = [-77.03 + NUDGE, 38.9];
    const rings = new Map<string, LngLat[]>([
      ['A', [[-77.04, 38.89], shared, [-77.04, 38.91], [-77.04, 38.89]]],
      ['B', [shared, [-77.02, 38.89], [-77.02, 38.91], shared]],
      ['C', [stray, [-77.03, 38.92], [-77.02, 38.92], stray]],
    ]);
    const { rings: out, moved } = mergeNearby(rings, 12);
    expect(moved).toBe(1);
    expect(out.get('C')![0]).toEqual(shared);
    expect(out.get('C')![3]).toEqual(shared);
    expect(out.get('A')).toEqual(rings.get('A'));
  });

  it('drops a repeat left inside one ring', () => {
    const rings = new Map<string, LngLat[]>([
      ['A', [[0, 38.9], [0 + NUDGE, 38.9], [0.01, 38.9], [0.01, 38.91], [0, 38.9]]],
    ]);
    const out = mergeNearby(rings, 12).rings.get('A')!;
    expect(out).toHaveLength(4);
    expect(out[0]).toEqual(out[out.length - 1]);
  });

  it('leaves alone corners further apart than the limit, and tiny rings', () => {
    const rings = new Map<string, LngLat[]>([
      ['A', [[0, 38.9], [0.001, 38.9], [0.001, 38.901], [0, 38.9]]],
      ['T', [[1, 38.9], [1 + NUDGE, 38.9], [1, 38.9 + NUDGE / 10], [1, 38.9]]],
    ]);
    const { rings: out } = mergeNearby(rings, 12);
    expect(out.get('A')).toEqual(rings.get('A'));
    expect(out.get('T')).toEqual(rings.get('T'));
  });
});
