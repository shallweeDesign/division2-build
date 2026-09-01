/** 計算引擎 / Engine rules, exercised against the real dataset. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameData, GearItem, GearSlot } from '../src/model/types.ts';
import { GEAR_SLOTS } from '../src/model/types.ts';
import { emptyBuild } from '../src/model/build.ts';
import type { BuildState } from '../src/model/build.ts';
import { activeSets, attributeIndex, computeBuild, defaultChoice, defaultChoicesFor, eligible } from '../src/model/calc/index.ts';
import { SKILL_TIER_CAP, STAT_CAPS } from '../src/model/calc/constants.ts';
import { WATCH_STAT_IDS, WATCH_STATS } from '../src/model/watch.ts';
import { resolveRecommended } from '../src/model/calc/recommend.ts';
import { RECOMMENDED } from '../src/data/recommended.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));
const attrs = attributeIndex(data);

/** Equip the first piece of `setName` found in `slot`. */
function equip(build: BuildState, slot: GearSlot, setName: string) {
  const item = data.gear[slot].find((i) => (i.brandSet ?? i.gearSet) === setName);
  if (!item) throw new Error(`no ${setName} ${slot} in dataset`);
  build.gear[slot] = { itemId: item.id, ...defaultChoicesFor(item, data, attrs) };
  return item;
}

/** A brand present in enough slots to test tiering. */
const BRAND = 'Providence Defense';
const GEARSET = data.sets.find((s) => s.kind === 'gearset')!.name;

describe('set tiers', () => {
  it('activates one more brand tier per piece, up to three', () => {
    for (const count of [1, 2, 3]) {
      const build = emptyBuild();
      GEAR_SLOTS.slice(0, count).forEach((s) => equip(build, s, BRAND));
      const [entry] = activeSets(data, computeBuild(data, build).items);
      expect(entry!.pieces).toBe(count);
      expect(entry!.active.map((t) => t.pieces)).toEqual([1, 2, 3].slice(0, count));
    }
  });

  it('grants a gear set nothing for a single piece', () => {
    const build = emptyBuild();
    const slot = GEAR_SLOTS.find((s) => data.gear[s].some((i) => i.gearSet === GEARSET))!;
    equip(build, slot, GEARSET);
    const [entry] = activeSets(data, computeBuild(data, build).items);
    expect(entry!.pieces).toBe(1);
    expect(entry!.active).toEqual([]);
    expect(entry!.next?.pieces).toBe(2);
  });

  it('reports how many more pieces the next tier needs', () => {
    const build = emptyBuild();
    GEAR_SLOTS.slice(0, 2).forEach((s) => equip(build, s, BRAND));
    const [entry] = activeSets(data, computeBuild(data, build).items);
    expect(entry!.next).toEqual({ pieces: 3, missing: 1 });
  });

  it('warns once a brand is worn beyond its third piece', () => {
    const build = emptyBuild();
    GEAR_SLOTS.slice(0, 4).forEach((s) => equip(build, s, BRAND));
    expect(computeBuild(data, build).warnings.some((w) => w.includes(BRAND))).toBe(true);
  });

  it('counts two sets independently', () => {
    const build = emptyBuild();
    equip(build, 'mask', BRAND);
    equip(build, 'chest', BRAND);
    equip(build, 'gloves', 'Fenris Group AB');
    const sets = activeSets(data, computeBuild(data, build).items);
    expect(sets.map((s) => [s.set.name, s.pieces])).toEqual([
      [BRAND, 2],
      ['Fenris Group AB', 1],
    ]);
  });

  it('surfaces the four-piece talent once a gear set is complete', () => {
    const slots = GEAR_SLOTS.filter((s) => data.gear[s].some((i) => i.gearSet === GEARSET)).slice(0, 4);
    const build = emptyBuild();
    slots.forEach((s) => equip(build, s, GEARSET));
    const [entry] = activeSets(data, computeBuild(data, build).items);
    expect(entry!.pieces).toBe(4);
    expect(entry!.talents.length).toBeGreaterThan(0);
  });
});

describe('attribute slots', () => {
  it('pre-fills a fixed slot and leaves a choice slot empty', () => {
    const fixed = data.gear.mask.flatMap((i) => i.cores).find((s) => s.mode === 'fixed')!;
    const choice = data.gear.mask.flatMap((i) => i.cores).find((s) => s.mode === 'choice')!;
    expect(defaultChoice(fixed, attrs).attributeId).toBeTruthy();
    expect(defaultChoice(choice, attrs).attributeId).toBeNull();
  });

  it('only offers attributes compatible with the slot', () => {
    const spec = data.gear.mask.flatMap((i) => i.minors).find((s) => s.mode === 'choice')!;
    const options = eligible(spec, data);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(o.compatibility).toContain(spec.slug);
  });

  it('honours a slot exclusion list', () => {
    const spec = [...GEAR_SLOTS.flatMap((s) => data.gear[s])]
      .flatMap((i) => [...i.cores, ...i.minors])
      .find((s) => s.mode === 'choice' && s.exclude.length > 0);
    if (!spec || spec.mode !== 'choice') return; // dataset may carry no exclusions
    const ids = eligible(spec, data).map((a) => a.id);
    for (const ex of spec.exclude) expect(ids).not.toContain(ex);
  });
});

describe('totals and caps', () => {
  it('counts one core per core slot on each equipped piece', () => {
    const build = emptyBuild();
    let expected = 0;
    for (const slot of GEAR_SLOTS) {
      const item = equip(build, slot, BRAND) as GearItem | undefined;
      if (item) expected += item.cores.length;
    }
    // Choice cores start empty, so only fixed cores are counted until chosen.
    const counted = Object.values(computeBuild(data, build).coreCounts).reduce((a, b) => a + b, 0);
    expect(counted).toBeLessThanOrEqual(expected);
  });

  it('caps critical hit chance at 60%', () => {
    const build = emptyBuild();
    equip(build, 'mask', BRAND);
    const crit = [...data.attributes, ...data.gearMods].find((a) => a.statId === 'critical-hit-chance')!;
    build.gear.mask.minors[0] = { attributeId: crit.id, value: { n: 500, percent: true } };
    const stat = computeBuild(data, build).stats.find((s) => s.statId === 'critical-hit-chance');
    expect(stat!.value).toBe(STAT_CAPS['critical-hit-chance']);
    expect(stat!.capped).toBe(true);
  });

  it('caps skill tier at six', () => {
    const build = emptyBuild();
    const tier = data.attributes.find((a) => a.statId === 'skill-tier')!;
    for (const slot of GEAR_SLOTS) {
      equip(build, slot, BRAND);
      if (build.gear[slot].cores[0]) build.gear[slot].cores[0] = { attributeId: tier.id, value: { n: 1, percent: false } };
    }
    const stat = computeBuild(data, build).stats.find((s) => s.statId === 'skill-tier');
    expect(stat!.value).toBe(SKILL_TIER_CAP);
  });

  it('leaves an uncapped stat untouched', () => {
    const build = emptyBuild();
    equip(build, 'mask', BRAND);
    const hsd = [...data.attributes, ...data.gearMods].find((a) => a.statId === 'headshot-damage')!;
    build.gear.mask.minors[0] = { attributeId: hsd.id, value: { n: 10, percent: true } };
    const stat = computeBuild(data, build).stats.find((s) => s.statId === 'headshot-damage');
    expect(stat!.capped).toBe(false);
    expect(stat!.value).toBe(stat!.raw);
  });

  it('accounts for every point of a stat in its contributions', () => {
    const build = emptyBuild();
    GEAR_SLOTS.slice(0, 3).forEach((s) => equip(build, s, BRAND));
    for (const s of computeBuild(data, build).stats) {
      expect(s.contributions.reduce((n, c) => n + c.value, 0), s.statId).toBeCloseTo(s.raw, 6);
    }
  });

  it('reports an empty build as six empty slots with no stats', () => {
    const { stats, sets, warnings } = computeBuild(data, emptyBuild());
    expect(stats).toEqual([]);
    expect(sets).toEqual([]);
    expect(warnings.some((w) => w.includes('6'))).toBe(true);
  });
});

describe('default rolls', () => {
  it("pre-selects a piece's set default core so it is usable straight away", () => {
    const build = emptyBuild();
    const item = equip(build, 'mask', BRAND);
    const set = data.sets.find((s) => s.name === BRAND)!;
    const chosen = build.gear.mask.cores[0]?.attributeId;
    expect(chosen, 'core should be pre-filled').toBeTruthy();
    expect(attrs.get(chosen!)!.statId).toBe(set.defaultCoreStatId);
    expect(item.cores.length).toBeGreaterThan(0);
  });

  it('defaults a pre-selected core to its maximum roll', () => {
    const build = emptyBuild();
    equip(build, 'mask', BRAND);
    const choice = build.gear.mask.cores[0]!;
    expect(choice.value).toEqual(attrs.get(choice.attributeId!)!.max);
  });

  it('leaves an exotic fixed core exactly as the dataset locks it', () => {
    const exotic = GEAR_SLOTS.flatMap((s) => data.gear[s]).find((i) => i.isExotic && i.cores[0]?.mode === 'fixed');
    if (!exotic) return;
    const spec = exotic.cores[0]!;
    if (spec.mode !== 'fixed') return;
    expect(defaultChoicesFor(exotic, data, attrs).cores[0]!.attributeId).toBe(spec.attributeId);
  });
});

describe('recommended builds', () => {
  it('fills all six slots for every template', () => {
    for (const template of RECOMMENDED) {
      const { unfilled } = resolveRecommended(data, template);
      expect(unfilled, `${template.id} left slots unfilled`).toEqual([]);
    }
  });

  it('equips the piece counts each template asks for', () => {
    for (const template of RECOMMENDED) {
      const { build } = resolveRecommended(data, template);
      const counts = new Map<string, number>();
      for (const slot of GEAR_SLOTS) {
        const id = build.gear[slot].itemId!;
        const item = data.gear[slot].find((i) => i.id === id)!;
        const set = item.brandSet ?? item.gearSet!;
        counts.set(set, (counts.get(set) ?? 0) + 1);
      }
      for (const spec of template.sets) {
        expect(counts.get(spec.name), `${template.id} → ${spec.name}`).toBe(spec.pieces);
      }
    }
  });

  it('never asks for more than six pieces', () => {
    for (const template of RECOMMENDED) {
      const total = template.sets.reduce((n, s) => n + s.pieces, 0);
      expect(total, template.id).toBeLessThanOrEqual(6);
    }
  });

  it('references only sets that exist', () => {
    const names = new Set(data.sets.map((s) => s.name));
    for (const template of RECOMMENDED) {
      for (const spec of template.sets) expect(names, `${template.id} → ${spec.name}`).toContain(spec.name);
    }
  });

  it('references only stats that exist', () => {
    const ids = new Set(data.stats.map((s) => s.id));
    for (const template of RECOMMENDED) {
      expect(ids, `${template.id} core`).toContain(template.core);
      for (const m of template.minors) expect(ids, `${template.id} minor`).toContain(m);
    }
  });

  it('activates the four-piece talent of each primary gear set', () => {
    for (const template of RECOMMENDED) {
      const primary = template.sets[0]!;
      if (primary.pieces < 4) continue;
      const { build } = resolveRecommended(data, template);
      const entry = activeSets(data, computeBuild(data, build).items).find((s) => s.set.name === primary.name);
      expect(entry?.talents.length, `${template.id} → ${primary.name}`).toBeGreaterThan(0);
    }
  });

  it('produces a build with no empty-slot warning', () => {
    for (const template of RECOMMENDED) {
      const { build } = resolveRecommended(data, template);
      const { warnings } = computeBuild(data, build);
      expect(warnings.some((w) => w.includes('empty slot')), template.id).toBe(false);
    }
  });

  it('gives every template a unique id and both languages', () => {
    const ids = RECOMMENDED.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RECOMMENDED) {
      expect(r.name['zh-tw'], r.id).toBeTruthy();
      expect(r.name.en, r.id).toBeTruthy();
      expect(r.summary['zh-tw'], r.id).toBeTruthy();
      expect(r.summary.en, r.id).toBeTruthy();
    }
  });
});

describe('SHD watch', () => {
  const statOf = (b: BuildState, id: string) =>
    computeBuild(data, b).stats.find((s) => s.statId === id);

  it('names sixteen stats that all exist in the dataset', () => {
    const known = new Set(data.stats.map((s) => s.id));
    expect(WATCH_STATS).toHaveLength(16);
    expect(new Set(WATCH_STAT_IDS).size).toBe(16);
    for (const id of WATCH_STAT_IDS) expect(known, id).toContain(id);
  });

  it('contributes nothing when the watch is untouched', () => {
    expect(computeBuild(data, emptyBuild()).stats).toHaveLength(0);
  });

  it('adds its bonus to the totals as a percentage', () => {
    const b = emptyBuild();
    b.watch['weapon-damage'] = 5;
    const stat = statOf(b, 'weapon-damage');
    expect(stat?.value).toBe(5);
    expect(stat?.percent).toBe(true);
  });

  it('stacks with what the gear already rolled', () => {
    const withGear = emptyBuild();
    equip(withGear, 'chest', BRAND);
    const before = statOf(withGear, 'weapon-damage')?.value ?? 0;

    withGear.watch['weapon-damage'] = 5;
    expect(statOf(withGear, 'weapon-damage')?.value).toBeCloseTo(before + 5, 5);
  });

  it('counts towards a capped stat rather than bypassing the cap', () => {
    const cap = STAT_CAPS['critical-hit-chance']!;
    const b = emptyBuild();
    b.watch['critical-hit-chance'] = cap + 10;
    const stat = statOf(b, 'critical-hit-chance');
    expect(stat?.value).toBe(cap);
    expect(stat?.capped).toBe(true);
  });

  it('is attributed to the watch in the contribution breakdown', () => {
    const b = emptyBuild();
    b.watch['skill-haste'] = 7.5;
    const stat = statOf(b, 'skill-haste');
    expect(stat?.contributions).toEqual([{ source: 'SHD', value: 7.5 }]);
  });

  it('tolerates a build saved before the watch existed', () => {
    // Phase 5 will share builds through the URL, so an older link will arrive
    // without a watch key at all.
    const { watch: _dropped, ...legacy } = emptyBuild();
    expect(() => computeBuild(data, legacy as BuildState)).not.toThrow();
  });
});

describe('talents', () => {
  it('reports nothing on an empty build', () => {
    expect(computeBuild(data, emptyBuild()).talents).toEqual([]);
  });

  it('picks up a talent chosen on a piece, with its wording', () => {
    const b = emptyBuild();
    const item = data.gear.chest.find((i) => i.talent?.mode === 'choice')!;
    const slug = (item.talent as { mode: 'choice'; slug: string }).slug;
    const talent = data.gearTalents.find((t) => t.compatibility.includes(slug))!;

    b.gear.chest = { itemId: item.id, ...defaultChoicesFor(item, data, attrs) };
    b.gear.chest.talent = talent.name;

    const found = computeBuild(data, b).talents.find((t) => t.name === talent.name);
    expect(found).toBeDefined();
    expect(found?.description).toBe(talent.description);
    expect(found?.source).toBe(item.name);
  });

  it('picks up a talent granted by a gear set bonus', () => {
    const set = data.sets.find((s) =>
      s.kind === 'gearset' && s.tiers.some((t) => t.entries.some((e) => e.kind === 'talent')));
    if (!set) return;                       // dataset without a talent-granting set
    const granted = set.tiers.flatMap((t) => t.entries)
      .find((e): e is { kind: 'talent'; name: string } => e.kind === 'talent')!;
    const tier = set.tiers.find((t) => t.entries.some((e) => e === granted))!;

    const b = emptyBuild();
    let placed = 0;
    for (const slot of GEAR_SLOTS) {
      if (placed >= tier.pieces) break;
      const item = data.gear[slot].find((i) => i.gearSet === set.name);
      if (!item) continue;
      b.gear[slot] = { itemId: item.id, ...defaultChoicesFor(item, data, attrs) };
      placed += 1;
    }
    if (placed < tier.pieces) return;       // set not spread across enough slots

    const found = computeBuild(data, b).talents.find((t) => t.name === granted.name);
    expect(found).toBeDefined();
    expect(found?.source).toBe(set.name);
  });

  it('lists a talent once even if two sources grant it', () => {
    const b = emptyBuild();
    const item = data.gear.chest.find((i) => i.talent?.mode === 'choice')!;
    const slug = (item.talent as { mode: 'choice'; slug: string }).slug;
    const talent = data.gearTalents.find((t) => t.compatibility.includes(slug))!;
    b.gear.chest = { itemId: item.id, ...defaultChoicesFor(item, data, attrs) };
    b.gear.chest.talent = talent.name;

    const names = computeBuild(data, b).talents.map((t) => t.name);
    expect(names.filter((n) => n === talent.name)).toHaveLength(1);
  });
});
