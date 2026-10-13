/** 配裝狀態 / The build a player is assembling. */
import type { GearSlot, SpecializationId, Value, WeaponSlot } from './types.ts';
import { GEAR_SLOTS, WEAPON_SLOTS } from './types.ts';
import { WATCH_STAT_IDS } from './watch.ts';

/** 一個屬性槽的選擇 / A player's choice in one attribute slot. */
export interface SlotChoice {
  /** Chosen attribute id, or `null` while unset. Fixed slots are pre-filled. */
  attributeId: string | null;
  /** Rolled magnitude, defaulting to the attribute's maximum. */
  value: Value | null;
}

export interface SlotState {
  itemId: string | null;
  cores: SlotChoice[];
  minors: SlotChoice[];
  mods: SlotChoice[];
  talent: string | null;
}

/**
 * 一個武器槽 / One of the three weapons.
 *
 * `mods` is positional: index n answers the weapon's own `mods[n]` slot, so a
 * weapon with no optics has no index for one. `null` is an empty slot, and a
 * slot the weapon fixes is not stored here at all — it cannot be changed.
 */
export interface WeaponSlotState {
  weaponId: string | null;
  cores: SlotChoice[];
  minors: SlotChoice[];
  mods: (string | null)[];
  talent: string | null;
}

export const emptyWeapon = (): WeaponSlotState =>
  ({ weaponId: null, cores: [], minors: [], mods: [], talent: null });

export interface BuildState {
  gear: Record<GearSlot, SlotState>;
  /**
   * 武器 / The three weapons. Kept apart from `gear` because their attributes
   * are not interchangeable: gear applies whatever you are holding, while a
   * weapon's own cores, attributes and parts only count while that weapon is
   * the one firing. Pooling them would count all three at once.
   */
  weapons: Record<WeaponSlot, WeaponSlotState>;
  /**
   * SHD 手錶加成 / Watch bonuses the player reads off the watch screen, keyed by
   * stat id and held as percentages. Always carries all sixteen keys so the
   * panel can render without guarding, with 0 meaning "nothing invested".
   */
  watch: Record<string, number>;
  /**
   * 專精 / The chosen specialization and which of its talents are taken.
   *
   * Talents are held by name rather than by tree position: the tree decides
   * what you may buy, but what a build *has* is a set of talents, and that is
   * what the summary and the totals care about.
   */
  spec: { id: SpecializationId | null; talents: string[] };
  /**
   * 技能 / The two skills, by variant name (`null` while empty). Always two
   * entries, positional, so the panel can render both without guarding.
   */
  skills: (string | null)[];
}

/** 技能槽數 / A build carries two skills. */
export const SKILL_SLOTS = 2;

export const emptyWatch = (): Record<string, number> =>
  Object.fromEntries(WATCH_STAT_IDS.map((id) => [id, 0]));

export const emptySlot = (): SlotState => ({ itemId: null, cores: [], minors: [], mods: [], talent: null });

export const emptyBuild = (): BuildState => ({
  gear: Object.fromEntries(GEAR_SLOTS.map((s) => [s, emptySlot()])) as Record<GearSlot, SlotState>,
  weapons: Object.fromEntries(WEAPON_SLOTS.map((s) => [s, emptyWeapon()])) as Record<WeaponSlot, WeaponSlotState>,
  watch: emptyWatch(),
  spec: { id: null, talents: [] },
  skills: Array.from({ length: SKILL_SLOTS }, () => null),
});

/**
 * 修整存檔 / Rebuild a saved build against today's dataset.
 *
 * A build saved weeks ago may name an item, weapon or skill the dataset has
 * since dropped or renamed. Rather than let a panel trip over an id it cannot
 * find, anything unknown is emptied, and the shape is filled out from
 * `emptyBuild` so an older save missing a field still loads.
 */
export function sanitizeBuild(
  data: { gear: Record<GearSlot, { id: string }[]>; weapons: { id: string }[];
    specializations: { id: SpecializationId }[]; skills: { name: string }[] },
  raw: unknown,
): BuildState {
  const out = emptyBuild();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<BuildState>;

  for (const slot of GEAR_SLOTS) {
    const s = r.gear?.[slot];
    if (s && (s.itemId === null || data.gear[slot].some((i) => i.id === s.itemId))) out.gear[slot] = { ...emptySlot(), ...s };
  }
  for (const slot of WEAPON_SLOTS) {
    const w = r.weapons?.[slot];
    if (w && (w.weaponId === null || data.weapons.some((x) => x.id === w.weaponId))) out.weapons[slot] = { ...emptyWeapon(), ...w };
  }
  for (const id of WATCH_STAT_IDS) {
    const v = r.watch?.[id];
    if (typeof v === 'number' && Number.isFinite(v)) out.watch[id] = v;
  }
  if (r.spec?.id && data.specializations.some((s) => s.id === r.spec!.id)) {
    out.spec = { id: r.spec.id, talents: Array.isArray(r.spec.talents) ? r.spec.talents.filter((x) => typeof x === 'string') : [] };
  }
  if (Array.isArray(r.skills)) {
    out.skills = out.skills.map((_, i) => {
      const name = r.skills![i];
      return typeof name === 'string' && data.skills.some((s) => s.name === name) ? name : null;
    });
  }
  return out;
}
