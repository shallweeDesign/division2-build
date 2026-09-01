/** 配裝狀態 / The build a player is assembling. */
import type { GearSlot, Value } from './types.ts';
import { GEAR_SLOTS } from './types.ts';
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

export interface BuildState {
  gear: Record<GearSlot, SlotState>;
  /**
   * SHD 手錶加成 / Watch bonuses the player reads off the watch screen, keyed by
   * stat id and held as percentages. Always carries all sixteen keys so the
   * panel can render without guarding, with 0 meaning "nothing invested".
   */
  watch: Record<string, number>;
}

export const emptyWatch = (): Record<string, number> =>
  Object.fromEntries(WATCH_STAT_IDS.map((id) => [id, 0]));

export const emptySlot = (): SlotState => ({ itemId: null, cores: [], minors: [], mods: [], talent: null });

export const emptyBuild = (): BuildState => ({
  gear: Object.fromEntries(GEAR_SLOTS.map((s) => [s, emptySlot()])) as Record<GearSlot, SlotState>,
  watch: emptyWatch(),
});
