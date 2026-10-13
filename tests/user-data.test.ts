/** 使用者資料 / Normalising, merging and loading the player's synced data. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameData } from '../src/model/types.ts';
import { emptyBuild, sanitizeBuild } from '../src/model/build.ts';
import { MAX_BUILDS, emptyUserData, mergeUserData, normalizeUserData } from '../src/cloud/user-data.ts';
import type { SavedBuild } from '../src/cloud/user-data.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));
const saved = (id: string, updatedAt: number, name = id): SavedBuild => ({ id, name, build: emptyBuild(), updatedAt });

describe('normalizeUserData', () => {
  it('turns anything stored or synced into a well-formed object', () => {
    expect(normalizeUserData(null)).toEqual(emptyUserData());
    expect(normalizeUserData('junk')).toEqual(emptyUserData());
    const d = normalizeUserData({
      lang: 'fr', collectibles: { beavers: [3, 1, 3, 'x', 2.5] },
      builds: [saved('a', 1), { id: 'no-build', name: 'x' }, null],
      extra: 'dropped',
    });
    expect(d.lang).toBeNull();
    expect(d.collectibles).toEqual({ beavers: [1, 3] });
    expect(d.builds.map((b) => b.id)).toEqual(['a']);
    expect(d).not.toHaveProperty('extra');
  });

  it('keeps no more builds than the cap', () => {
    const many = Array.from({ length: MAX_BUILDS + 5 }, (_, i) => saved(`b${i}`, i));
    expect(normalizeUserData({ builds: many }).builds).toHaveLength(MAX_BUILDS);
  });
});

describe('mergeUserData (first sign-in in a browser)', () => {
  it('unions ticks, keeps the newer copy of a build, and prefers the account language', () => {
    const local = { ...emptyUserData(), lang: 'en' as const, collectibles: { beavers: [1, 2] },
      builds: [saved('shared', 200, 'local edit'), saved('only-local', 50)] };
    const cloud = { ...emptyUserData(), lang: 'zh-tw' as const, collectibles: { beavers: [2, 9], other: [1] },
      builds: [saved('shared', 100, 'cloud copy'), saved('only-cloud', 300)] };
    const m = mergeUserData(local, cloud);
    expect(m.lang).toBe('zh-tw');
    expect(m.collectibles).toEqual({ beavers: [1, 2, 9], other: [1] });
    expect(m.builds.map((b) => b.id)).toEqual(['only-cloud', 'shared', 'only-local']);
    expect(m.builds.find((b) => b.id === 'shared')!.name).toBe('local edit');
  });

  it('keeps the browser language when the account has none', () => {
    expect(mergeUserData({ ...emptyUserData(), lang: 'en' }, emptyUserData()).lang).toBe('en');
  });
});

describe('sanitizeBuild (loading a saved build)', () => {
  const someMask = data.gear.mask[0]!;
  const someWeapon = data.weapons[0]!;

  it('keeps what still exists in the dataset', () => {
    const b = emptyBuild();
    b.gear.mask.itemId = someMask.id;
    b.weapons.primary.weaponId = someWeapon.id;
    b.skills[0] = data.skills[0]!.name;
    const out = sanitizeBuild(data, JSON.parse(JSON.stringify(b)));
    expect(out.gear.mask.itemId).toBe(someMask.id);
    expect(out.weapons.primary.weaponId).toBe(someWeapon.id);
    expect(out.skills[0]).toBe(data.skills[0]!.name);
  });

  it('empties anything the dataset no longer has, instead of crashing a panel', () => {
    const b = emptyBuild() as unknown as Record<string, unknown>;
    (b.gear as Record<string, { itemId: string }>).mask!.itemId = 'mask-gone-since-last-season';
    (b.weapons as Record<string, { weaponId: string }>).primary!.weaponId = 'weapon-gone';
    b.skills = ['Not A Skill', null];
    b.spec = { id: 'not-a-spec', talents: ['x'] };
    const out = sanitizeBuild(data, b);
    expect(out.gear.mask.itemId).toBeNull();
    expect(out.weapons.primary.weaponId).toBeNull();
    expect(out.skills).toEqual([null, null]);
    expect(out.spec.id).toBeNull();
  });

  it('fills in fields an older save did not have', () => {
    const out = sanitizeBuild(data, { gear: {} });
    expect(out).toEqual(emptyBuild());
  });
});
