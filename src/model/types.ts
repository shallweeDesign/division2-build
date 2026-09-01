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

export const WEAPON_MOD_CATEGORIES = ['optics', 'magazine', 'muzzle', 'underbarrel'] as const;
export type WeaponModCategory = (typeof WEAPON_MOD_CATEGORIES)[number];

/** 武器配件 / One row of weapon_mods.csv: a named part with fixed stat changes. */
export interface WeaponMod {
  name: string;
  category: WeaponModCategory;
  /**
   * Slot slugs this part fits. Empty means the row named no slug — those are
   * reachable only from a weapon that asks for them by name, not from a
   * dropdown, so an empty list is "fits nothing" rather than "fits everything".
   */
  compatibility: string[];
  /** Can be negative: a scope that trades reload speed for headshot damage. */
  stats: { statId: string; value: Value }[];
}

export type WeaponModSlot =
  | { category: WeaponModCategory; mode: 'choice'; slug: string }
  | { category: WeaponModCategory; mode: 'fixed'; name: string };

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
  /**
   * Mod slots in fixed order; a weapon without a given slot omits it.
   * Exotics and some named weapons bolt a specific part on instead of taking
   * a category, so a slot is either a choice or already decided.
   */
  mods: WeaponModSlot[];
}

export const SPECIALIZATIONS = [
  'demolitionist', 'firewall', 'gunner', 'sharpshooter', 'survivalist', 'technician',
] as const;
export type SpecializationId = (typeof SPECIALIZATIONS)[number];

/**
 * 專精天賦的效果 / A spec talent reduced to numbers, where the wording allowed.
 *
 * `weaponTypes` is the reason this is not just a stat and a value: one line
 * reads "+3% headshot damage with Rifles and Marksman Rifles", and folding
 * that into a global headshot bonus would overstate every other weapon.
 */
export interface SpecEffect {
  statId: string;
  value: Value;
  /** Empty means it always applies; otherwise only for these weapon types. */
  weaponTypes: string[];
}

export interface SpecTalent {
  name: string;
  description: string;
  /**
   * Empty when the wording could not be reduced to numbers — a conditional, a
   * group buff, an ammo mechanic. Those are shown and not counted, rather than
   * guessed at.
   */
  effects: SpecEffect[];
}

/** 專精技能樹的一個節點 / One node of a specialization tree. */
export interface SpecNode {
  name: string;
  type: 'hub' | 'node';
  category: string | null;
  parent: string | null;
  /** Hubs carry the point budget; nodes carry tiers and their costs. */
  budget: number | null;
  maxTier: number | null;
  tierCosts: number[];
}

export interface Specialization {
  id: SpecializationId;
  nodes: SpecNode[];
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
  weaponMods: WeaponMod[];
  specializations: Specialization[];
  specTalents: SpecTalent[];
  gear: Record<GearSlot, GearItem[]>;
  weapons: Weapon[];
  skills: SkillVariant[];
  augments: Augment[];
}
