/**
 * 每日戰利品譯名 / Names for the daily loot page.
 *
 * 任務名刻意留空，理由同 `skills.ts`：沒有可對照的來源確認官方譯名，寧可顯示英文。
 * 在 Google Sheet 以 `mission` 種類補上，鍵為來源的英文任務名（例如 `Camp White Oak`）。
 *
 * Mission names are deliberately empty for the same reason as `SKILL_ZH`: a
 * visibly English name beats a plausible wrong one. Fill them in from the
 * Google Sheet under kind `mission`, keyed by the source's English name.
 */
import { ITEM_ZH, SET_ZH } from './names.ts';

export const MISSION_ZH: Record<string, string> = {};

/** 補給箱類別 / Vendor cache categories, as the source words them. */
export const CACHE_TYPE_ZH: Record<string, string> = {
  Weapons: '武器',
  Gear: '裝備',
};

/** 補給箱內容 / Cache contents: the source uses plural slot / weapon-class words. */
export const CACHE_ITEM_ZH: Record<string, string> = {
  ARs: '突擊步槍',
  LMGs: '輕機槍',
  MMRs: '射手步槍',
  Pistols: '手槍',
  Rifles: '步槍',
  Shotguns: '霰彈槍',
  SMGs: '衝鋒槍',
  Masks: '面罩',
  'Chest Pieces': '胸甲',
  Backpacks: '背包',
  Gloves: '手套',
  Holsters: '槍套',
  Kneepads: '護膝',
};

/**
 * 正規化 / The source and the dataset disagree on small things — the source
 * writes "Walker, Harris & Co", the dataset "Walker, Harris & Co." — so lookups
 * compare on lower case with trailing dots and spaces dropped.
 */
const norm = (s: string) => s.trim().replace(/[.\s]+$/, '').toLowerCase();

/** 依正規化鍵查表 / Look a name up in a map by its normalised key. */
function lookup(map: Record<string, string>, name: string): string | undefined {
  if (map[name]) return map[name];
  const key = norm(name);
  for (const [k, v] of Object.entries(map)) if (norm(k) === key) return v;
  return undefined;
}

/** 目標戰利品名 / A loot target is a brand, a gear set, or now and then an item. */
export const lootZh = (name: string) => lookup(SET_ZH, name) ?? lookup(ITEM_ZH, name);
export const missionZh = (name: string) => lookup(MISSION_ZH, name);
export const cacheTypeZh = (name: string) => lookup(CACHE_TYPE_ZH, name);
export const cacheItemZh = (name: string) => lookup(CACHE_ITEM_ZH, name);
