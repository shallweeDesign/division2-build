/**
 * 戰利品詞彙 / One place that decides what a word in the loot source means.
 *
 * The source is free text and its wording drifts: the same slot is "Chest
 * Pieces" in a vendor cache and "Body Armor" as a mission target; a brand
 * loses its trailing dot ("Walker, Harris & Co"). Every word on the page —
 * mission target or cache entry — is resolved here, to a brand or gear set,
 * a weapon class or a gear slot, and the Chinese name and the popup both
 * follow from that. A word nothing here knows is `unknown`, and the page
 * shows it as such rather than offering a popup that can only fail.
 *
 * Three layers, tried in order:
 *  1. Aliases from the Google Sheet (kind `alias`), so a new wording can be
 *     mapped onto a known one with no build and no deploy.
 *  2. The brand and gear-set names from the dataset.
 *  3. The weapon-class and slot words below, including their synonyms.
 * Each compares on a loose key — case, punctuation, spacing and a plural `s`
 * are ignored — so "SMGs", "smg" and "S.M.G." all land on the same entry.
 */
import type { GearSlot } from './types.ts';
import setNames from '../data/generated/set-names.json';

export type LootRef =
  | { kind: 'set'; name: string }
  | { kind: 'weapon'; weaponType: string }
  | { kind: 'slot'; slot: GearSlot }
  | { kind: 'unknown' };

/** 寬鬆鍵 / Lower case, letters and digits only. */
export const looseKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The key itself, then without or with a plural `s`. */
const variants = (key: string) =>
  [key, key.endsWith('s') ? key.slice(0, -1) : `${key}s`];

/** 武器類別 / Weapon-class words, keyed by the dataset's `weaponType`. */
const WEAPON_WORDS: Record<string, string[]> = {
  'Assault Rifle': ['Assault Rifle', 'AR'],
  LMG: ['LMG', 'Light Machine Gun'],
  'Marksman Rifle': ['Marksman Rifle', 'MMR', 'DMR', 'Sniper', 'Sniper Rifle'],
  Pistol: ['Pistol', 'Sidearm', 'Handgun'],
  Rifle: ['Rifle'],
  Shotgun: ['Shotgun'],
  SMG: ['SMG', 'Submachine Gun'],
};

/** 裝備部位 / Gear-slot words, including how the source has worded them. */
const SLOT_WORDS: Record<GearSlot, string[]> = {
  mask: ['Mask'],
  chest: ['Chest', 'Chest Piece', 'Body Armor', 'Body Armour', 'Vest'],
  backpack: ['Backpack'],
  gloves: ['Gloves', 'Glove'],
  holster: ['Holster'],
  knees: ['Kneepads', 'Knee Pads', 'Kneepad', 'Knees'],
};

const index = new Map<string, LootRef>();
for (const [weaponType, words] of Object.entries(WEAPON_WORDS)) {
  for (const w of words) index.set(looseKey(w), { kind: 'weapon', weaponType });
}
for (const [slot, words] of Object.entries(SLOT_WORDS) as [GearSlot, string[]][]) {
  for (const w of words) index.set(looseKey(w), { kind: 'slot', slot });
}

/**
 * 品牌／套裝 / The dataset's set names, from a small file `npm run data` writes
 * beside the dataset, so a new brand is recognised without a code change.
 */
const sets = new Map((setNames as string[]).map((n) => [looseKey(n), n]));

/**
 * 別名 / Source word → a word this file already knows, from the sheet's
 * `alias` rows. Filled at runtime by `loadOverrides`; keys are compared loose.
 */
export const LOOT_ALIAS: Record<string, string> = {};

function direct(word: string): LootRef {
  for (const k of variants(looseKey(word))) {
    const set = sets.get(k);
    if (set) return { kind: 'set', name: set };
    const hit = index.get(k);
    if (hit) return hit;
  }
  return { kind: 'unknown' };
}

/** 解析 / What a loot word refers to. Never throws; unknown is a result. */
export function resolveLoot(word: string): LootRef {
  const key = looseKey(word);
  if (!key) return { kind: 'unknown' };
  for (const [from, to] of Object.entries(LOOT_ALIAS)) {
    if (variants(key).includes(looseKey(from))) {
      const ref = direct(to);
      if (ref.kind !== 'unknown') return ref;
    }
  }
  return direct(word);
}
