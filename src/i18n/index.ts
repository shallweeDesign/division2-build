/** 介面文案 / UI strings, with the language persisted across visits. */
import { STAT_ZH } from './stats.ts';

export type Lang = 'zh-tw' | 'en';

const UI = {
  title: { 'zh-tw': '全境封鎖2 配裝工具', en: 'The Division 2 Build Planner' },
  gear: { 'zh-tw': '裝備', en: 'Gear' },
  stats: { 'zh-tw': '屬性總覽', en: 'Stats' },
  setBonuses: { 'zh-tw': '套裝加成', en: 'Set Bonuses' },
  warnings: { 'zh-tw': '提醒', en: 'Warnings' },
  cores: { 'zh-tw': '核心屬性', en: 'Cores' },
  empty: { 'zh-tw': '未裝備', en: 'Empty' },
  core: { 'zh-tw': '核心', en: 'Core' },
  mod: { 'zh-tw': '模組', en: 'Mod' },
  talent: { 'zh-tw': '天賦', en: 'Talent' },
  attribute: { 'zh-tw': '屬性', en: 'Attribute' },
  clear: { 'zh-tw': '清空配裝', en: 'Clear build' },
  noStats: { 'zh-tw': '尚未裝備任何部位', en: 'Nothing equipped yet' },
  noCores: { 'zh-tw': '尚未選擇核心屬性', en: 'No cores chosen yet' },
  pieces: { 'zh-tw': '件', en: 'pc' },
  needMore: { 'zh-tw': '再 {n} 件解鎖 {p} 件加成', en: '{n} more for the {p}-piece bonus' },
  capped: { 'zh-tw': '已達上限', en: 'capped' },
  dataBanner: {
    'zh-tw': '資料來源：div2hub/game-data (CC BY 4.0)。非官方資料，請以遊戲內實際數值為準。',
    en: 'Data: div2hub/game-data (CC BY 4.0). Unofficial — verify against the game.',
  },
  slot: {
    mask: { 'zh-tw': '面罩', en: 'Mask' },
    chest: { 'zh-tw': '胸甲', en: 'Chest' },
    backpack: { 'zh-tw': '背包', en: 'Backpack' },
    gloves: { 'zh-tw': '手套', en: 'Gloves' },
    holster: { 'zh-tw': '槍套', en: 'Holster' },
    knees: { 'zh-tw': '護膝', en: 'Kneepads' },
  },
  quality: {
    'high-end': { 'zh-tw': '高階', en: 'High End' },
    named: { 'zh-tw': '具名', en: 'Named' },
    gearset: { 'zh-tw': '套裝', en: 'Gear Set' },
    exotic: { 'zh-tw': '奇特', en: 'Exotic' },
  },
  category: {
    offensive: { 'zh-tw': '攻擊', en: 'Offensive' },
    defensive: { 'zh-tw': '防禦', en: 'Defensive' },
    skill: { 'zh-tw': '技能', en: 'Skill' },
  },
} as const;

const KEY = 'd2b.lang';
let current: Lang = (localStorage.getItem(KEY) as Lang) || 'zh-tw';

export const lang = () => current;

export function setLang(next: Lang) {
  current = next;
  localStorage.setItem(KEY, next);
  document.documentElement.lang = next === 'zh-tw' ? 'zh-Hant' : 'en';
}

type Entry = Record<Lang, string>;
const pick = (e: Entry) => e[current];

/** 取得介面文字 / Look up a top-level UI string. */
export const t = (key: keyof typeof UI): string => {
  const entry = UI[key];
  return typeof (entry as Entry)['zh-tw'] === 'string' ? pick(entry as Entry) : String(key);
};

export const tSlot = (slot: keyof typeof UI.slot) => pick(UI.slot[slot]);
export const tQuality = (q: keyof typeof UI.quality) => pick(UI.quality[q]);
export const tCategory = (c: keyof typeof UI.category) => pick(UI.category[c]);

/**
 * 屬性名 / Stat name in the active language, looked up by stat id. English is
 * the source of truth, so `fallback` (the dataset's own name) is used when a
 * Chinese name is missing rather than showing a raw id.
 */
export const tStat = (statId: string, fallback: string) =>
  current === 'zh-tw' ? STAT_ZH[statId] ?? fallback : fallback;

/** Item and set names stay in English — that is how the community refers to them. */
export const tItem = (name: string) => name;
