/**
 * 配裝計算引擎 / Build calculation engine.
 * Pure functions over (GameData, BuildState) so every rule is unit-testable.
 */
import type {
  AttributeDef, AttributeSlotSpec, GameData, GearItem, GearSlot, SetDef, Value,
  Weapon, WeaponMod, WeaponSlot,
} from '../types.ts';
import { GEAR_SLOTS } from '../types.ts';
import type { BuildState, SlotChoice, SlotState } from '../build.ts';
import { WATCH_STAT_IDS } from '../watch.ts';
import { MAX_PIECES, STAT_CAPS } from './constants.ts';

/** Label used for every watch contribution, so the UI can pick them out. */
export const WATCH_SOURCE = 'SHD';

export interface Contribution {
  source: string;
  value: number;
}

export interface StatTotal {
  statId: string;
  /** Total after caps. */
  value: number;
  /** Total before caps; differs from `value` only when a cap bit. */
  raw: number;
  capped: boolean;
  percent: boolean;
  contributions: Contribution[];
}

/** 已裝備的套裝 / An equipped set and which of its tiers are live. */
export interface ActiveSet {
  set: SetDef;
  pieces: number;
  active: SetDef['tiers'];
  /** The next tier and how many more pieces it needs, if any remain. */
  next: { pieces: number; missing: number } | null;
  /** Talents granted by active tiers (gear sets' 4-piece payoff). */
  talents: string[];
}

/**
 * 生效中的天賦 / A talent in play, with the text that says what it does.
 *
 * Talents reach a build two ways — rolled on a chest or backpack, or handed
 * over by a gear set's four-piece bonus — and the player needs the wording
 * either way, so both are resolved to the same shape here.
 */
export interface ActiveTalent {
  name: string;
  /** Empty when the dataset has no wording for it. */
  description: string;
  /** The piece or set it came from, for display. */
  source: string;
}

export interface BuildSummary {
  items: Partial<Record<GearSlot, GearItem>>;
  sets: ActiveSet[];
  stats: StatTotal[];
  /** Cores in play, keyed by stat id (weapon-damage / total-armor / skill-tier). */
  coreCounts: Record<string, number>;
  talents: ActiveTalent[];
  warnings: string[];
}

/** 屬性索引 / Attribute lookup covering both gear attributes and gear mods. */
export function attributeIndex(data: GameData): Map<string, AttributeDef> {
  return new Map([...data.attributes, ...data.gearMods].map((a) => [a.id, a]));
}

/** 槽位預設值 / The choice a slot starts with: fixed slots are already decided. */
export function defaultChoice(spec: AttributeSlotSpec, attrs: Map<string, AttributeDef>): SlotChoice {
  if (spec.mode === 'fixed') {
    const def = attrs.get(spec.attributeId);
    return { attributeId: spec.attributeId, value: spec.value ?? def?.max ?? null };
  }
  return { attributeId: null, value: null };
}

/**
 * 裝備預設選擇 / The choices a freshly equipped piece starts with.
 *
 * Fixed slots are already decided. For a choice core we pre-select the set's
 * `default_core_stat_id` — every piece in game carries a core, and the set's
 * default is the one it drops with, so starting empty would just make the
 * player pick the obvious answer six times.
 */
export function defaultChoicesFor(item: GearItem, data: GameData, attrs: Map<string, AttributeDef>) {
  const setName = setOf(item);
  const defaultStat = setName ? data.sets.find((s) => s.name === setName)?.defaultCoreStatId ?? null : null;

  const core = (spec: AttributeSlotSpec): SlotChoice => {
    if (spec.mode !== 'choice' || !defaultStat) return defaultChoice(spec, attrs);
    const match = eligible(spec, data).find((a) => a.statId === defaultStat);
    return match ? { attributeId: match.id, value: match.max } : defaultChoice(spec, attrs);
  };

  return {
    cores: item.cores.map(core),
    minors: item.minors.map((s) => defaultChoice(s, attrs)),
    mods: item.mods.map((s) => defaultChoice(s, attrs)),
    talent: item.talent?.mode === 'fixed' ? item.talent.name : null,
  };
}

/** 可選屬性 / Attributes a choice slot may roll. */
export function eligible(spec: AttributeSlotSpec, data: GameData): AttributeDef[] {
  if (spec.mode !== 'choice') return [];
  return [...data.attributes, ...data.gearMods].filter(
    (a) => a.compatibility.includes(spec.slug) && !spec.exclude.includes(a.id),
  );
}

function resolveItems(data: GameData, build: BuildState) {
  const items: Partial<Record<GearSlot, GearItem>> = {};
  for (const slot of GEAR_SLOTS) {
    const id = build.gear[slot].itemId;
    if (!id) continue;
    const found = data.gear[slot].find((i) => i.id === id);
    if (found) items[slot] = found;
  }
  return items;
}

/** 套裝件數 / Which set each equipped piece counts toward. */
export function setOf(item: GearItem): string | null {
  return item.brandSet ?? item.gearSet;
}

export function activeSets(data: GameData, items: Partial<Record<GearSlot, GearItem>>): ActiveSet[] {
  const counts = new Map<string, number>();
  for (const item of Object.values(items)) {
    const name = item && setOf(item);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const byName = new Map(data.sets.map((s) => [s.name, s]));
  const out: ActiveSet[] = [];
  for (const [name, pieces] of counts) {
    const set = byName.get(name);
    if (!set) continue;
    const active = set.tiers.filter((t) => pieces >= t.pieces);
    const upcoming = set.tiers.find((t) => pieces < t.pieces);
    out.push({
      set,
      pieces,
      active,
      next: upcoming ? { pieces: upcoming.pieces, missing: upcoming.pieces - pieces } : null,
      talents: active.flatMap((t) => t.entries.filter((e) => e.kind === 'talent').map((e) => e.name)),
    });
  }
  return out.sort((a, b) => b.pieces - a.pieces || a.set.name.localeCompare(b.set.name));
}

interface Bucket { raw: number; percent: boolean; contributions: Contribution[] }

function add(map: Map<string, Bucket>, statId: string, source: string, value: Value | null) {
  if (!statId || !value || !Number.isFinite(value.n) || value.n === 0) return;
  const b = map.get(statId) ?? { raw: 0, percent: value.percent, contributions: [] };
  b.raw += value.n;
  b.contributions.push({ source, value: value.n });
  map.set(statId, b);
}

/**
 * 武器可用的配件 / Parts that fit one slot of one weapon.
 *
 * A row with no compatibility fits nothing offered in a dropdown: those parts
 * exist only because some weapon names them outright.
 */
export function eligibleMods(data: GameData, slot: { category: string; slug: string }): WeaponMod[] {
  return data.weaponMods.filter((m) => m.category === slot.category && m.compatibility.includes(slot.slug));
}

export interface WeaponTotals {
  weapon: Weapon;
  /** Gear, sets and watch, plus everything on this weapon. */
  stats: StatTotal[];
  talent: ActiveTalent | null;
  mods: WeaponMod[];
}

/**
 * 單把武器的總屬性 / One weapon's totals: the shared pool plus its own parts.
 *
 * Gear applies to whatever is in your hands, but a weapon's cores, attributes
 * and parts only count while that weapon is firing — so they are layered per
 * weapon here rather than added to the shared buckets, which would count all
 * three weapons at once.
 */
export function computeWeapon(data: GameData, build: BuildState, slot: WeaponSlot): WeaponTotals | null {
  const state = build.weapons[slot];
  const weapon = state.weaponId ? data.weapons.find((w) => w.id === state.weaponId) ?? null : null;
  if (!weapon) return null;

  const attrs = attributeIndex(data);
  const buckets = sharedBuckets(data, build);

  for (const c of [...state.cores, ...state.minors]) {
    if (!c.attributeId) continue;
    const def = attrs.get(c.attributeId);
    if (def) add(buckets, def.statId, weapon.name, c.value);
  }

  const mods: WeaponMod[] = [];
  const byName = new Map(data.weaponMods.map((m) => [m.name, m]));
  weapon.mods.forEach((spec, i) => {
    const name = spec.mode === 'fixed' ? spec.name : state.mods[i] ?? null;
    const mod = name ? byName.get(name) : undefined;
    if (!mod) return;
    mods.push(mod);
    for (const st of mod.stats) add(buckets, st.statId, mod.name, st.value);
  });

  const talentName = weapon.talent?.mode === 'fixed' ? weapon.talent.name : state.talent;
  const text = new Map(data.weaponTalents.map((t) => [t.name, t.description]));
  const talent = talentName
    ? { name: talentName, description: text.get(talentName) ?? '', source: weapon.name }
    : null;

  return { weapon, stats: totalled(data, buckets).stats, talent, mods };
}

/**
 * 共用加成 / Everything that applies no matter what you are holding: gear,
 * set bonuses and the SHD watch. A weapon's own parts are layered on top of a
 * copy of this, per weapon, in `computeWeapon`.
 */
function sharedBuckets(data: GameData, build: BuildState): Map<string, Bucket> {
  const { buckets } = gearBuckets(data, build);
  return buckets;
}

/** 套用上限 / Apply the caps and sort, shared by both callers. */
function totalled(data: GameData, buckets: Map<string, Bucket>) {
  const stats: StatTotal[] = [...buckets]
    .map(([statId, b]) => {
      const cap = STAT_CAPS[statId];
      const value = cap === undefined ? b.raw : Math.min(b.raw, cap);
      return { statId, raw: b.raw, value, capped: value !== b.raw, percent: b.percent, contributions: b.contributions };
    })
    .sort((a, b) => a.statId.localeCompare(b.statId));

  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const warnings = stats.filter((s) => s.capped).map((s) =>
    `${statName.get(s.statId) ?? s.statId}：${s.raw} 超過上限 ${s.value} / capped at ${s.value}, ${round(s.raw - s.value)} wasted`);
  return { stats, warnings };
}

function gearBuckets(data: GameData, build: BuildState) {
  const items = resolveItems(data, build);
  const attrs = attributeIndex(data);
  const buckets = new Map<string, Bucket>();
  const coreCounts: Record<string, number> = {};
  const warnings: string[] = [];

  // 1. Everything the player rolled on each equipped piece.
  for (const slot of GEAR_SLOTS) {
    const item = items[slot];
    if (!item) continue;
    const state: SlotState = build.gear[slot];
    const apply = (choices: SlotChoice[], label: string, isCore: boolean) => {
      for (const c of choices) {
        if (!c.attributeId) continue;
        const def = attrs.get(c.attributeId);
        if (!def) continue;
        add(buckets, def.statId, label ? `${item.name} (${label})` : item.name, c.value);
        if (isCore) coreCounts[def.statId] = (coreCounts[def.statId] ?? 0) + 1;
      }
    };
    apply(state.cores, 'core', true);
    apply(state.minors, '', false);
    apply(state.mods, 'mod', false);
  }

  // 2. Brand and gear-set bonuses.
  const sets = activeSets(data, items);
  for (const entry of sets) {
    for (const tier of entry.active) {
      for (const e of tier.entries) {
        if (e.kind === 'stat') add(buckets, e.statId, `${entry.set.name} (${tier.pieces}pc)`, e.value);
      }
    }
    const limit = MAX_PIECES[entry.set.kind];
    if (entry.pieces > limit) {
      warnings.push(`${entry.set.name}：${entry.pieces} 件，超過 ${limit} 件不再增加加成 / ${entry.pieces} pieces; bonuses stop at ${limit}`);
    }
  }

  // 3. SHD watch. Same buckets as everything else, so a watch bonus counts
  //    towards a cap exactly like a rolled attribute does.
  for (const statId of WATCH_STAT_IDS) {
    const n = build.watch?.[statId] ?? 0;
    add(buckets, statId, WATCH_SOURCE, { n, percent: true });
  }

  return { items, sets, buckets, coreCounts, warnings };
}

export function computeBuild(data: GameData, build: BuildState): BuildSummary {
  const { items, sets, buckets, coreCounts, warnings } = gearBuckets(data, build);
  const { stats, warnings: capWarnings } = totalled(data, buckets);
  warnings.push(...capWarnings);

  // 5. Talents, from the pieces that carry one and from set bonuses.
  const talentText = new Map(data.gearTalents.map((t) => [t.name, t.description]));
  const talents: ActiveTalent[] = [];
  const seen = new Set<string>();
  const addTalent = (name: string | null | undefined, source: string) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    talents.push({ name, description: talentText.get(name) ?? '', source });
  };
  for (const slot of GEAR_SLOTS) {
    const item = items[slot];
    if (!item?.talent) continue;
    addTalent(item.talent.mode === 'fixed' ? item.talent.name : build.gear[slot].talent, item.name);
  }
  for (const entry of sets) {
    for (const name of entry.talents) addTalent(name, entry.set.name);
  }

  const empty = GEAR_SLOTS.filter((s) => !items[s]);
  if (empty.length) warnings.push(`尚有 ${empty.length} 個空部位 / ${empty.length} empty slot(s)`);

  return { items, sets, stats, coreCounts, talents, warnings };
}

const round = (n: number) => Math.round(n * 10) / 10;
