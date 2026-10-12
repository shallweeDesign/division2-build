/**
 * 每日戰利品譯名 / Names for the daily loot page.
 *
 * 任務名刻意留空，理由同 `skills.ts`：沒有可對照的來源確認官方譯名，寧可顯示英文。
 * 在 Google Sheet 以 `mission` 種類補上，鍵為來源的英文任務名（例如 `Camp White Oak`）。
 *
 * Mission names are deliberately empty for the same reason as `SKILL_ZH`: a
 * visibly English name beats a plausible wrong one. Fill them in from the
 * Google Sheet under kind `mission`, keyed by the source's English name.
 *
 * Loot words — targets and cache entries alike — are named from what
 * `resolveLoot` says they are, so a new wording for a known thing ("Body
 * Armor" for chest) gets its Chinese name with no table of its own.
 */
import { ITEM_ZH, SET_ZH, SLOT_ZH } from './names.ts';
import { looseKey, resolveLoot } from '../model/loot-vocab.ts';

export const MISSION_ZH: Record<string, string> = {};

/** 補給箱類別 / Vendor cache categories, as the source words them. */
export const CACHE_TYPE_ZH: Record<string, string> = {
  Weapons: '武器',
  Gear: '裝備',
};

/** 武器類別 / By the dataset's `weaponType`, as in the planner. */
const WEAPON_TYPE_ZH: Record<string, string> = {
  'Assault Rifle': '突擊步槍',
  LMG: '輕機槍',
  'Marksman Rifle': '射手步槍',
  Pistol: '手槍',
  Rifle: '步槍',
  Shotgun: '霰彈槍',
  SMG: '衝鋒槍',
};

/** 依寬鬆鍵查表 / Look a name up by its loose key (see `looseKey`). */
function lookup(map: Record<string, string>, name: string): string | undefined {
  if (map[name]) return map[name];
  const key = looseKey(name);
  for (const [k, v] of Object.entries(map)) if (looseKey(k) === key) return v;
  return undefined;
}

/** 戰利品名 / The Chinese name for any loot word, target or cache entry. */
export function lootZh(word: string): string | undefined {
  const ref = resolveLoot(word);
  switch (ref.kind) {
    case 'set': return SET_ZH[ref.name] ?? ITEM_ZH[ref.name];
    case 'weapon': return WEAPON_TYPE_ZH[ref.weaponType];
    case 'slot': return SLOT_ZH[ref.slot];
    default: return undefined;
  }
}

export const missionZh = (name: string) => lookup(MISSION_ZH, name);
export const cacheTypeZh = (name: string) => lookup(CACHE_TYPE_ZH, name);
