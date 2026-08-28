/**
 * 配裝計算引擎 / Build calculation engine.
 * Pure functions over (GameData, BuildState) so every rule is unit-testable.
 */
import type {
  AttributeDef, AttributeSlotSpec, GameData, GearItem, GearSlot, SetDef, Value,
} from '../types.ts';
import { GEAR_SLOTS } from '../types.ts';
import type { BuildState, SlotChoice, SlotState } from '../build.ts';
import { MAX_PIECES, STAT_CAPS } from './constants.ts';

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

export interface BuildSummary {
  items: Partial<Record<GearSlot, GearItem>>;
  sets: ActiveSet[];
  stats: StatTotal[];
  /** Cores in play, keyed by stat id (weapon-damage / total-armor / skill-tier). */
  coreCounts: Record<string, number>;
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

export function computeBuild(data: GameData, build: BuildState): BuildSummary {
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

  // 3. Total and cap.
  const stats: StatTotal[] = [...buckets]
    .map(([statId, b]) => {
      const cap = STAT_CAPS[statId];
      const value = cap === undefined ? b.raw : Math.min(b.raw, cap);
      return { statId, raw: b.raw, value, capped: value !== b.raw, percent: b.percent, contributions: b.contributions };
    })
    .sort((a, b) => a.statId.localeCompare(b.statId));

  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  for (const s of stats) {
    if (s.capped) {
      warnings.push(`${statName.get(s.statId) ?? s.statId}：${s.raw} 超過上限 ${s.value} / capped at ${s.value}, ${round(s.raw - s.value)} wasted`);
    }
  }

  const empty = GEAR_SLOTS.filter((s) => !items[s]);
  if (empty.length) warnings.push(`尚有 ${empty.length} 個空部位 / ${empty.length} empty slot(s)`);

  return { items, sets, stats, coreCounts, warnings };
}

const round = (n: number) => Math.round(n * 10) / 10;
