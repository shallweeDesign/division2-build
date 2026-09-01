/**
 * 資料集結構驗證 / Structural invariants of the generated dataset.
 * These guard the shape the calculator relies on, so an upstream schema change
 * fails here rather than surfacing as wrong numbers in the UI.
 */
import { describe, expect, it } from 'vitest';
import { TALENT_ZH, talentZh } from '../src/i18n/talents.ts';
import { WEAPON_MOD_CATEGORIES } from '../src/model/types.ts';
import { readFileSync } from 'node:fs';
import { GEAR_SLOTS } from '../src/model/types.ts';
import type { GameData } from '../src/model/types.ts';
import { STAT_ZH } from '../src/i18n/stats.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));
const allItems = GEAR_SLOTS.flatMap((s) => data.gear[s]);

describe('gear', () => {
  it('has items in every slot', () => {
    for (const slot of GEAR_SLOTS) expect(data.gear[slot].length, slot).toBeGreaterThan(0);
  });

  it('gives every item a unique id', () => {
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('files every item under the slot it claims', () => {
    for (const slot of GEAR_SLOTS) for (const item of data.gear[slot]) expect(item.slot).toBe(slot);
  });

  it('never puts an item in both a brand and a gear set', () => {
    for (const item of allItems) expect(Boolean(item.brandSet && item.gearSet), item.name).toBe(false);
  });

  it('resolves every set reference to a defined set', () => {
    const names = new Set(data.sets.map((s) => s.name));
    for (const item of allItems) {
      const set = item.brandSet ?? item.gearSet;
      if (set) expect(names, item.name).toContain(set);
    }
  });

  it('leaves exotics outside brands and gear sets', () => {
    for (const item of allItems.filter((i) => i.isExotic)) {
      expect(item.brandSet, item.name).toBeNull();
      expect(item.gearSet, item.name).toBeNull();
    }
  });

  it('gives every piece at least one core slot', () => {
    for (const item of allItems) expect(item.cores.length, item.name).toBeGreaterThan(0);
  });

  it('points every fixed attribute slot at a real attribute', () => {
    const ids = new Set([...data.attributes, ...data.gearMods].map((a) => a.id));
    for (const item of allItems) {
      for (const spec of [...item.cores, ...item.minors, ...item.mods]) {
        if (spec.mode === 'fixed') expect(ids, `${item.name} → ${spec.attributeId}`).toContain(spec.attributeId);
      }
    }
  });

  it('names a talent that exists whenever one is fixed', () => {
    const names = new Set([...data.gearTalents, ...data.weaponTalents].map((t) => t.name));
    for (const item of allItems) {
      if (item.talent?.mode === 'fixed') expect(names, item.name).toContain(item.talent.name);
    }
  });

  it('offers at least one eligible attribute for every choice slot', () => {
    const pool = [...data.attributes, ...data.gearMods];
    for (const item of allItems) {
      for (const spec of [...item.cores, ...item.minors, ...item.mods]) {
        if (spec.mode !== 'choice') continue;
        const options = pool.filter((a) => a.compatibility.includes(spec.slug) && !spec.exclude.includes(a.id));
        expect(options.length, `${item.name} → ${spec.slug}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('sets', () => {
  it('caps brands at three pieces and gear sets at four', () => {
    for (const set of data.sets) {
      const max = set.kind === 'brand' ? 3 : 4;
      for (const tier of set.tiers) expect(tier.pieces, set.name).toBeLessThanOrEqual(max);
    }
  });

  it('gives gear sets no one-piece bonus', () => {
    for (const set of data.sets.filter((s) => s.kind === 'gearset')) {
      expect(set.tiers.some((t) => t.pieces === 1), set.name).toBe(false);
    }
  });

  it('orders tiers by ascending piece count', () => {
    for (const set of data.sets) {
      const pieces = set.tiers.map((t) => t.pieces);
      expect(pieces, set.name).toEqual([...pieces].sort((a, b) => a - b));
    }
  });

  it('resolves every stat bonus to a known stat', () => {
    const ids = new Set(data.stats.map((s) => s.id));
    for (const set of data.sets) {
      for (const tier of set.tiers) {
        for (const e of tier.entries) if (e.kind === 'stat') expect(ids, `${set.name} ${tier.pieces}pc`).toContain(e.statId);
      }
    }
  });

  it('gives every gear set a four-piece talent', () => {
    for (const set of data.sets.filter((s) => s.kind === 'gearset')) {
      const four = set.tiers.find((t) => t.pieces === 4);
      expect(four?.entries.some((e) => e.kind === 'talent'), set.name).toBe(true);
    }
  });
});

describe('attributes', () => {
  it('resolves every attribute to a known stat', () => {
    const ids = new Set(data.stats.map((s) => s.id));
    for (const a of [...data.attributes, ...data.gearMods]) expect(ids, a.id).toContain(a.statId);
  });

  it('never lets a minimum roll exceed its maximum', () => {
    for (const a of [...data.attributes, ...data.gearMods]) expect(a.min.n, a.id).toBeLessThanOrEqual(a.max.n);
  });

  it('puts any prototype ceiling at or above the normal maximum', () => {
    for (const a of data.attributes) if (a.protoMax) expect(a.protoMax.n, a.id).toBeGreaterThanOrEqual(a.max.n);
  });
});

describe('weapons', () => {
  it('gives every weapon a unique id', () => {
    const ids = data.weapons.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every weapon positive damage and rate of fire, except registered gaps', () => {
    const gapped = data.weapons.filter((w) => w.baseDamage === null || w.rpm === null).map((w) => w.name);
    expect(gapped, 'weapons missing stats must be covered by known_gaps.json').toEqual(['Steel & Sons ACR']);
    for (const w of data.weapons.filter((x) => x.baseDamage !== null)) {
      expect(w.baseDamage!, w.name).toBeGreaterThan(0);
      expect(w.rpm!, w.name).toBeGreaterThan(0);
    }
  });

  it('restricts pistols to the sidearm slot', () => {
    for (const w of data.weapons.filter((x) => x.weaponType === 'Pistol')) expect(w.slotType, w.name).toBe('sidearm');
  });
});

describe('provenance', () => {
  it('records the source and licence so the UI can attribute it', () => {
    expect(data.meta.source).toBe('div2hub/game-data');
    expect(data.meta.license).toContain('CC BY');
    expect(data.meta.sourceUrl).toMatch(/^https:\/\//);
  });
});

describe('translations', () => {
  it('has a Chinese name for every stat in the dataset', () => {
    const missing = data.stats.map((s) => s.id).filter((id) => !STAT_ZH[id]).sort();
    expect(missing, `untranslated stats: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('item names', () => {
  /**
   * Sets with no confirmed Chinese name yet. Listing them keeps the gap visible
   * while still failing on any set that becomes untranslated in future.
   */
  const UNTRANSLATED_SETS = ['Ember Engine'];

  it('translates every generic set piece into Chinese', async () => {
    const { tItem, setLang } = await import('../src/i18n/index.ts');
    setLang('zh-tw');
    const generic = allItems.filter((i) => !i.isNamed && !i.isExotic && (i.brandSet ?? i.gearSet));
    const untranslated = generic
      .filter((i) => tItem(i.name, i.slot, i.brandSet ?? i.gearSet) === i.name)
      // 5.11 Tactical keeps its Latin brand name, so its pieces stay partly Latin.
      .filter((i) => !i.name.startsWith('5.11 Tactical'))
      .filter((i) => !UNTRANSLATED_SETS.includes(i.brandSet ?? i.gearSet ?? ''));
    expect(untranslated.map((i) => i.name), 'generic pieces still in English').toEqual([]);
  });

  it('keeps the untranslated-set list honest — every entry must still be missing', async () => {
    const { SET_ZH } = await import('../src/i18n/names.ts');
    const names = new Set(data.sets.map((s) => s.name));
    for (const set of UNTRANSLATED_SETS) {
      expect(names, `${set} is no longer in the dataset`).toContain(set);
      expect(SET_ZH[set], `${set} now has a translation — remove it from the list`).toBeUndefined();
    }
  });

  it('composes a generic name from its set and slot', async () => {
    const { tItem, setLang } = await import('../src/i18n/index.ts');
    setLang('zh-tw');
    expect(tItem('Providence Defense Mask', 'mask', 'Providence Defense')).toBe('天命防禦公司面罩');
    expect(tItem('5.11 Tactical Kneepads', 'knees', '5.11 Tactical')).toBe('5.11 Tactical 護膝');
  });

  it('leaves item names untouched in English mode', async () => {
    const { tItem, setLang } = await import('../src/i18n/index.ts');
    setLang('en');
    expect(tItem('Providence Defense Mask', 'mask', 'Providence Defense')).toBe('Providence Defense Mask');
    setLang('zh-tw');
  });

  it('reports how many named and exotic items still lack a Chinese name', async () => {
    const { ITEM_ZH } = await import('../src/i18n/names.ts');
    const special = allItems.filter((i) => i.isNamed || i.isExotic);
    const missing = special.filter((i) => !ITEM_ZH[i.name]);
    // Not a failure: these fall back to English until confirmed names exist.
    console.info(`  ℹ ${missing.length}/${special.length} named/exotic items have no Chinese name yet`);
    expect(missing.length).toBeLessThanOrEqual(special.length);
  });
});

describe('talent names', () => {
  const talents = new Set([
    ...data.gearTalents.map((t) => t.name),
    ...data.weaponTalents.map((t) => t.name),
  ]);

  it('only maps talents that still exist in the dataset', () => {
    // The community sheets list talents the game has removed; anything left
    // here that the data no longer knows about is a stale mapping.
    for (const name of Object.keys(TALENT_ZH)) expect(talents, name).toContain(name);
  });

  it('derives the Perfect variant from its base talent', () => {
    expect(talentZh('Perfect Braced')).toBe('完美鼓起勇氣');
    expect(talentZh('Braced')).toBe('鼓起勇氣');
  });

  it('returns nothing for a talent with no sourced name', () => {
    expect(talentZh('Bewildered')).toBeUndefined();
  });

  it('reports how many talents still lack a Chinese name', () => {
    const named = [...talents].filter((n) => talentZh(n) !== undefined).length;
    console.info(`  ℹ ${talents.size - named}/${talents.size} talents have no Chinese name yet`);
    expect(named).toBeGreaterThan(0);
  });
});

describe('weapon mods', () => {
  const mods = data.weaponMods;
  const byName = new Map(mods.map((m) => [m.name, m]));
  const statIds = new Set(data.stats.map((s) => s.id));

  it('parses every row with a known category and stat', () => {
    expect(mods.length).toBeGreaterThan(200);
    for (const m of mods) {
      expect(WEAPON_MOD_CATEGORIES, m.name).toContain(m.category);
      for (const st of m.stats) expect(statIds, `${m.name}/${st.statId}`).toContain(st.statId);
    }
  });

  it('keeps a mod that trades one stat away for another', () => {
    // A long scope buys headshot damage with reload speed; a parser that
    // dropped the sign would quietly make it a pure upgrade.
    const negative = mods.filter((m) => m.stats.some((s) => s.value.n < 0));
    expect(negative.length).toBeGreaterThan(0);
  });

  it('offers at least one part for every choice slot a weapon has', () => {
    const unfillable: string[] = [];
    for (const w of data.weapons) {
      for (const slot of w.mods) {
        if (slot.mode !== 'choice') continue;
        const fits = mods.some((m) => m.category === slot.category && m.compatibility.includes(slot.slug));
        if (!fits) unfillable.push(`${w.name} ${slot.category}:${slot.slug}`);
      }
    }
    expect(unfillable).toEqual([]);
  });

  it('resolves every fixed mod to a real part', () => {
    for (const w of data.weapons) {
      for (const slot of w.mods) {
        if (slot.mode === 'fixed') expect(byName.has(slot.name), `${w.name}: ${slot.name}`).toBe(true);
      }
    }
  });
});
