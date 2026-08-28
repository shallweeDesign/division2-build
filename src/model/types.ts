/**
 * 全境封鎖2 配裝資料模型 / The Division 2 build data model.
 * Mirrors the div2hub/game-data CSV schema; see data/README.md for the source
 * conventions this encodes.
 */

export const GEAR_SLOTS = ['mask', 'chest', 'backpack', 'gloves', 'holster', 'knees'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const WEAPON_SLOTS = ['primary', 'secondary', 'sidearm'] as const;
export type WeaponSlot = (typeof WEAPON_SLOTS)[number];

/** 屬性顏色 / Attribute colour groups: red, blue and yellow in game. */
export type Category = 'offensive' | 'defensive' | 'skill';

/** 數值 / A rollable magnitude. Percent and flat values are not interchangeable. */
export interface Value {
  n: number;
  percent: boolean;
}

/** 屬性定義 / One rollable attribute row from attributes.csv. */
export interface AttributeDef {
  id: string;
  statId: string;
  min: Value;
  max: Value;
  /** Expertise/prototype ceiling, above `max`; `null` when the row has none. */
  protoMax: Value | null;
  /** Dropdown eligibility slugs; empty when the row is only reachable via `fixed:`. */
  compatibility: string[];
  category: Category;
  /** Step granularity of a legal roll; `null` when the roll is fully fixed. */
  fidelity: Value | null;
}

/** 屬性槽 / How one core/minor/mod slot on an item behaves. */
export type AttributeSlotSpec =
  | { mode: 'none' }
  /** Player picks any attribute whose compatibility includes `slug`, minus `exclude`. */
  | { mode: 'choice'; slug: string; exclude: string[] }
  /** Locked to one attribute; `value` present when the roll itself is fixed too. */
  | { mode: 'fixed'; attributeId: string; value: Value | null };

export interface Stat {
  id: string;
  name: string;
  valueFormats: string[];
}

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  /** Exactly one of these is set for set pieces; both `null` for exotics. */
  brandSet: string | null;
  gearSet: string | null;
  isNamed: boolean;
  isExotic: boolean;
  cores: AttributeSlotSpec[];
  minors: AttributeSlotSpec[];
  mods: AttributeSlotSpec[];
  /** Talent compatibility slug, a fixed talent name, or `null` for no talent. */
  talent: { mode: 'choice'; slug: string } | { mode: 'fixed'; name: string } | null;
}

/** 套裝加成 / One entry of a set-bonus tier. */
export type BonusEntry =
  | { kind: 'stat'; statId: string; value: Value }
  | { kind: 'talent'; name: string };

export interface SetTier {
  pieces: number;
  entries: BonusEntry[];
}

export interface SetDef {
  name: string;
  /** Brands cap at 3 pieces; gear sets run to 4. */
  kind: 'brand' | 'gearset';
  defaultCoreStatId: string | null;
  tiers: SetTier[];
}

export interface Talent {
  name: string;
  /** Slot(s) the talent can appear on; empty when it is item-specific. */
  compatibility: string[];
  description: string;
}

export interface Weapon {
  id: string;
  name: string;
  /** Which equipment slots accept it: `main` fits primary/secondary. */
  slotType: 'main' | 'sidearm';
  weaponType: string;
  family: string;
  isNamed: boolean;
  isExotic: boolean;
  baseDamage: number | null;
  rpm: number | null;
  magSize: number | null;
  reloadTime: number | null;
  optimalRange: number | null;
  headshotDamage: Value | null;
  cores: AttributeSlotSpec[];
  minors: AttributeSlotSpec[];
  talent: { mode: 'choice'; slug: string } | { mode: 'fixed'; name: string } | null;
}

export interface SkillVariant {
  name: string;
  /** Parent skill; `Decoy` is its own parent. */
  skill: string;
}

export interface Augment {
  name: string;
  description: string;
  min: Value | null;
  max: Value | null;
}

/** 資料集出處 / Provenance, surfaced in the UI to satisfy CC-BY attribution. */
export interface DataMeta {
  source: string;
  sourceUrl: string;
  sourceCommit: string;
  fetchedAt: string;
  license: string;
  licenseUrl: string;
  /** Unexpired entries from the upstream known_gaps.json. */
  knownGaps: string[];
}

export interface GameData {
  meta: DataMeta;
  stats: Stat[];
  attributes: AttributeDef[];
  gearMods: AttributeDef[];
  sets: SetDef[];
  gearTalents: Talent[];
  weaponTalents: Talent[];
  gear: Record<GearSlot, GearItem[]>;
  weapons: Weapon[];
  skills: SkillVariant[];
  augments: Augment[];
}
