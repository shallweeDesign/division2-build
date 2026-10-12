/**
 * 裝備部位詳情 / What a gear slot can be worth chasing — as a vendor cache
 * ("Chest Pieces") or a mission target ("Body Armor"): the exotic and named
 * pieces for that slot, exotics first.
 *
 * The 66 plain brand/set pieces per slot are left out on purpose — each is
 * just "{brand} {slot}", and the brand popups already show them.
 */
import type { GearItem, GearSlot } from './types.ts';
import { findSet, pieceViewFor } from './set-detail.ts';
import { resolveLoot } from './loot-vocab.ts';
import type { PieceView, SetData } from './set-detail.ts';

/** 對應部位 / The dataset's slot for a loot word, or null (see `loot-vocab.ts`). */
export const gearSlotOf = (name: string): GearSlot | null => {
  const ref = resolveLoot(name);
  return ref.kind === 'slot' ? ref.slot : null;
};

export interface GearSlotDetail {
  slot: GearSlot;
  groups: { tier: 'exotic' | 'named'; pieces: { piece: PieceView; setName: string | null }[] }[];
}

export function gearSlotDetail(data: SetData, name: string): GearSlotDetail | null {
  const slot = gearSlotOf(name);
  if (!slot) return null;

  const view = pieceViewFor(data);
  const setName = (i: GearItem) => i.brandSet ?? i.gearSet;
  const entry = (i: GearItem) => {
    const s = setName(i);
    return { piece: view(i, s ? findSet(data, s) : null), setName: s };
  };
  // Named pieces sit with their brand, so a player can scan by brand.
  const byName = (a: GearItem, b: GearItem) =>
    (setName(a) ?? '').localeCompare(setName(b) ?? '') || a.name.localeCompare(b.name);

  const items = data.gear[slot];
  const groups = [
    { tier: 'exotic' as const, pieces: items.filter((i) => i.isExotic).sort(byName).map(entry) },
    { tier: 'named' as const, pieces: items.filter((i) => i.isNamed && !i.isExotic).sort(byName).map(entry) },
  ].filter((g) => g.pieces.length > 0);

  return { slot, groups };
}
