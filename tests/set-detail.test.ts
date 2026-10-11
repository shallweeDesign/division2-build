/** 套裝詳情 / The loot popup's view of a brand or gear set, against the real dataset. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameData } from '../src/model/types.ts';
import { findSet, setDetail } from '../src/model/set-detail.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));

describe('setDetail', () => {
  it('matches the loot source\'s spelling despite trailing punctuation', () => {
    expect(findSet(data, 'Walker, Harris & Co')?.name).toBe('Walker, Harris & Co.');
    expect(findSet(data, 'Legatus S.p.A.')).not.toBeNull();
    expect(findSet(data, 'Pistol')).toBeNull();
  });

  it('lays out a brand: three tiers, core type, named pieces after the plain one', () => {
    const d = setDetail(data, 'Hana-U Corporation')!;
    expect(d.set.kind).toBe('brand');
    expect(d.tiers.map((t) => t.pieces)).toEqual([1, 2, 3]);
    expect(d.slotTalents).toEqual([]);
    const backpack = d.pieces.find((p) => p.slot === 'backpack')!;
    expect(backpack.items.map((p) => p.item.isNamed)).toEqual([false, true]);
    expect(backpack.items[1]!.talent).toMatchObject({ fixed: true, name: 'Perfect Combined Arms' });
    // Every plain piece's core follows the brand's default core.
    for (const { items } of d.pieces) {
      expect(items[0]!.cores[0]).toMatchObject({ fixed: false, statId: d.set.defaultCoreStatId });
    }
  });

  it('lays out a gear set: the 4pc talent and the chest/backpack talents with text', () => {
    const d = setDetail(data, 'Heartbreaker')!;
    expect(d.set.kind).toBe('gearset');
    const four = d.tiers.find((t) => t.pieces === 4)!.entries[0]!;
    expect(four).toMatchObject({ kind: 'talent', name: 'Heartstopper' });
    expect(four.kind === 'talent' && four.description).toBeTruthy();
    expect(d.slotTalents.map((s) => [s.slot, s.name])).toEqual([['chest', 'Max BPM'], ['backpack', 'Cold']]);
    expect(d.slotTalents.every((s) => s.description)).toBe(true);
  });

  it('shows a named piece\'s fixed attribute at its maximum roll', () => {
    const d = setDetail(data, 'Gila Guard')!;
    const mask = d.pieces.find((p) => p.slot === 'mask')!;
    const night = mask.items.find((p) => p.item.name === 'Nightwatcher')!;
    expect(night.item.isNamed).toBe(true);
    const fixed = night.minors.find((m) => m.fixed);
    const attr = data.attributes.find((a) => a.id === 'scanner-pulse-haste-nightwatcher')!;
    expect(fixed).toMatchObject({ fixed: true, statId: attr.statId, value: attr.max });
    expect(night.minors.some((m) => !m.fixed)).toBe(true);
  });

  it('resolves every target the loot source has published so far', () => {
    const brandsAndSets = ['Airaldi Holdings', 'China Light Industries', 'Concentrated Company', 'Edelweiss GPz',
      'Electrique', 'Foundry Bulwark', 'Grupo Sombra S.A.', 'Hana-U Corporation', 'Hard Wired', 'Heartbreaker',
      'Legatus S.p.A.', 'Ongoing Directive', 'Ortiz: Reficere', 'Overlord Armaments', 'Petrov Defense Group',
      'Providence Defense', 'Refactor', 'Tip of the Spear', 'Tipping Scales', 'True Patriot', 'Walker, Harris & Co'];
    for (const n of brandsAndSets) {
      const d = setDetail(data, n);
      expect(d, n).not.toBeNull();
      expect(d!.pieces.length, n).toBeGreaterThan(0);
    }
  });
});
