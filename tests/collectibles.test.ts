/** 收集品 / The beaver list: complete, in order, and linked to real anchors. */
import { describe, expect, it } from 'vitest';
import { BEAVER_COUNT, BEAVER_GUIDE, BEAVER_STAGES, beaverAnchor } from '../src/data/collectibles/broken-rain-beavers.ts';
import { COLLECTIONS } from '../src/data/collectibles/index.ts';
import { DARK_HOURS } from '../src/data/collectibles/raid-dark-hours.ts';
import { IRON_HORSE } from '../src/data/collectibles/raid-iron-horse.ts';
import { itemsOf } from '../src/data/collectibles/types.ts';

/** Section ids on the guide page, as captured on 2026-10-13. */
const GUIDE_IDS = [
    'beaver-location-1-tree-stump-in-the-cove',
    'beaver-location-2-waterfall-ledge',
    'beaver-location-3-near-the-electric-hazard',
    'beaver-location-4-ledge-near-the-flower-patch',
    'beaver-location-5-rooftop-after-the-first-boss',
    'beaver-location-6-behind-the-gate',
    'beaver-location-7-on-the-hill',
    'beaver-location-8-in-a-bin-by-the-tree',
    'beaver-location-9-in-a-bin-in-the-back-area',
    'beaver-location-10-inside-the-car',
    'beaver-location-11-on-top-of-the-vent',
    'beaver-location-12-between-the-cars',
    'beaver-location-13-near-fallen-antenna-tower',
    'beaver-location-14-pile-of-trash-on-the-bridge',
    'beaver-location-15-on-the-electric-grid',
    'beaver-location-16-on-the-wheel-rim-structure',
    'beaver-location-17-in-the-locker',
    'beaver-location-18-in-the-turbine-room-pipes',
    'beaver-location-19-watching-from-the-dark',
    'beaver-location-20-behind-the-mesh',
    'beaver-location-21-on-the-bar-above',
    'beaver-location-22-behind-the-machine',
    'beaver-location-23-behind-the-box',
    'beaver-location-24-before-clearing-the-hostiles',
    'beaver-location-25-in-the-boxes',
    'beaver-location-26-on-the-rock',
    'beaver-location-27-enjoying-the-view',
    'beaver-location-28-after-opening-the-gates',
    'beaver-location-29-in-the-life-ring',
    'beaver-location-30-on-the-shelving',
];

describe('broken rain beavers', () => {
  const all = BEAVER_STAGES.flatMap((s) => s.beavers);

  it('has all 30, numbered 1 to 30 in route order', () => {
    expect(BEAVER_COUNT).toBe(30);
    expect(all.map((b) => b.n)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it('links each location to its own section of the guide', () => {
    expect(all.map((b) => beaverAnchor(b))).toEqual(GUIDE_IDS.map((id) => `${BEAVER_GUIDE}#${id}`));
  });

  it('gives every location Chinese directions', () => {
    for (const b of all) {
      expect(b.zh, String(b.n)).toBeTruthy();
      expect(b.where.length, String(b.n)).toBeGreaterThan(10);
    }
  });
});

describe('collections', () => {
  it('have unique ids, and every item a unique number and directions', () => {
    expect(new Set(COLLECTIONS.map((c) => c.id)).size).toBe(COLLECTIONS.length);
    for (const c of COLLECTIONS) {
      const items = itemsOf(c);
      expect(new Set(items.map((i) => i.n)).size, c.id).toBe(items.length);
      for (const i of items) {
        expect(i.zh, `${c.id} ${i.n}`).toBeTruthy();
        expect(i.where.length, `${c.id} ${i.n}`).toBeGreaterThan(10);
        expect(c.guides.some((g) => c.link(i).startsWith(g.url.split('#')[0]!)), `${c.id} ${i.n}`).toBe(true);
      }
    }
  });

  it('keeps the beavers at the id their saved progress uses', () => {
    expect(COLLECTIONS[0]!.id).toBe('broken-rain-beavers');
    expect(itemsOf(COLLECTIONS[0]!)).toHaveLength(30);
  });

  it('gives each raid the five keys its end chest takes', () => {
    for (const raid of [DARK_HOURS, IRON_HORSE]) {
      expect(itemsOf(raid).filter((i) => i.kind === 'key'), raid.id).toHaveLength(5);
    }
  });

  it('lists one trophy in Dark Hours and five in Iron Horse, by name', () => {
    expect(itemsOf(DARK_HOURS).filter((i) => i.kind === 'trophy')).toHaveLength(1);
    expect(itemsOf(IRON_HORSE).filter((i) => i.kind === 'trophy').map((i) => i.en))
      .toEqual(['Breakthrough', 'Molten', 'High Ground', 'Iron Horse', 'Old Guard']);
  });
});
