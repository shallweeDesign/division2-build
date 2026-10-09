/** 介面文案 / UI strings, with the language persisted across visits. */
import { STAT_ZH } from './stats.ts';
import { ITEM_ZH, SET_ZH, SLOT_ZH } from './names.ts';
import { talentZh } from './talents.ts';
import { SKILL_ZH } from './skills.ts';

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
  recommended: { 'zh-tw': '推薦套裝', en: 'Recommended builds' },
  recommendedNote: {
    'zh-tw': '起手範本，不是最佳解。套用後再依你的裝備與玩法調整。',
    en: 'Starting points, not optimal builds — tune them to your gear and playstyle.',
  },
  apply: { 'zh-tw': '套用', en: 'Apply' },
  talents: { 'zh-tw': '天賦', en: 'Talents' },
  noTalents: { 'zh-tw': '尚未選擇天賦', en: 'No talents yet' },
  noTalentText: { 'zh-tw': '資料源沒有這個天賦的說明', en: 'No wording for this talent in the dataset' },
  weapons: { 'zh-tw': '武器', en: 'Weapons' },
  damage: { 'zh-tw': '傷害', en: 'Damage' },
  specialization: { 'zh-tw': '專精', en: 'Specialization' },
  notCounted: { 'zh-tw': '（未計入數值）', en: '(not counted)' },
  specStandalone: { 'zh-tw': '獨立節點', en: 'Standalone nodes' },
  specEquipNote: {
    'zh-tw': '以下是專精配備（手榴彈、專精手槍、簽名武器彈藥），沒有可選的天賦層級。',
    en: 'Spec equipment — grenade, sidearm, signature ammo. No talent tiers to pick.',
  },
  spec: {
    demolitionist: { 'zh-tw': '爆破手', en: 'Demolitionist' },
    firewall:      { 'zh-tw': '防火牆', en: 'Firewall' },
    gunner:        { 'zh-tw': '機槍手', en: 'Gunner' },
    sharpshooter:  { 'zh-tw': '神射手', en: 'Sharpshooter' },
    survivalist:   { 'zh-tw': '生存者', en: 'Survivalist' },
    technician:    { 'zh-tw': '技術員', en: 'Technician' },
  },
  dpsOverview: { 'zh-tw': 'DPS 概覽', en: 'DPS overview' },
  damageNumbers: { 'zh-tw': '每發傷害', en: 'Damage numbers' },
  baseOnly: { 'zh-tw': '武器本身', en: 'Base' },
  withBuild: { 'zh-tw': '含配裝', en: 'With build' },
  burstDps: { 'zh-tw': '爆發 DPS', en: 'Burst DPS' },
  sustainedDps: { 'zh-tw': '持續 DPS', en: 'Sustained DPS' },
  dmgPerMag: { 'zh-tw': '每彈匣傷害', en: 'Damage / mag' },
  avgShot: { 'zh-tw': '平均每發', en: 'Average shot' },
  vsArmor: { 'zh-tw': '對裝甲', en: 'vs Armor' },
  vsHealth: { 'zh-tw': '對生命值', en: 'vs Health' },
  hitBody: { 'zh-tw': '身體', en: 'Body' },
  hitBodyCrit: { 'zh-tw': '身體 爆擊', en: 'Body crit' },
  hitHead: { 'zh-tw': '爆頭', en: 'Headshot' },
  hitHeadCrit: { 'zh-tw': '爆頭 爆擊', en: 'Headshot crit' },
  noWeapon: { 'zh-tw': '尚未裝備武器', en: 'No weapon equipped' },
  noBaseDamage: { 'zh-tw': '這把武器的基礎數值尚未登記', en: 'This weapon has no base figures recorded yet' },
  twdMissing: {
    'zh-tw': '未含「總武器傷害」——資料源沒有這個屬性，它只來自天賦，所以這些是天賦前的數字。',
    en: 'Total Weapon Damage is not included: no stat in the data set carries it, so these are pre-talent figures.',
  },
  headCritNote: {
    'zh-tw': '爆頭爆擊採「爆擊與爆頭同括號相加」的算法——來源對此有分歧，此為較保守的一種。',
    en: 'Headshot crit treats crit and headshot damage as sharing one bracket. Sources disagree; this is the conservative reading.',
  },
  baseDamage: { 'zh-tw': '基礎傷害', en: 'Base damage' },
  magazine: { 'zh-tw': '彈匣', en: 'Magazine' },
  reload: { 'zh-tw': '裝彈', en: 'Reload' },
  optics: { 'zh-tw': '瞄準鏡', en: 'Optics' },
  muzzle: { 'zh-tw': '槍口', en: 'Muzzle' },
  underbarrel: { 'zh-tw': '槍管下方', en: 'Underbarrel' },
  weaponSlot: {
    primary:   { 'zh-tw': '主要武器', en: 'Primary' },
    secondary: { 'zh-tw': '次要武器', en: 'Secondary' },
    sidearm:   { 'zh-tw': '隨身武器', en: 'Sidearm' },
  },
  weaponType: {
    'Assault Rifle':  { 'zh-tw': '突擊步槍', en: 'Assault Rifle' },
    'LMG':            { 'zh-tw': '輕機槍',   en: 'LMG' },
    'Marksman Rifle': { 'zh-tw': '射手步槍', en: 'Marksman Rifle' },
    'Pistol':         { 'zh-tw': '手槍',     en: 'Pistol' },
    'Rifle':          { 'zh-tw': '步槍',     en: 'Rifle' },
    'Shotgun':        { 'zh-tw': '霰彈槍',   en: 'Shotgun' },
    'SMG':            { 'zh-tw': '衝鋒槍',   en: 'SMG' },
  },
  watch: { 'zh-tw': 'SHD 手錶', en: 'SHD Watch' },
  watchNote: {
    'zh-tw': '依遊戲內手錶畫面上顯示的加成填寫。留空或 0 表示未投入。',
    en: 'Enter the bonuses shown on your watch screen. Blank or 0 means nothing invested.',
  },
  watchClear: { 'zh-tw': '清空手錶', en: 'Clear watch' },
  nodeOffensive: { 'zh-tw': '攻擊', en: 'Offensive' },
  nodeDefensive: { 'zh-tw': '防禦', en: 'Defensive' },
  nodeHandling: { 'zh-tw': '操控', en: 'Handling' },
  nodeUtility: { 'zh-tw': '輔助', en: 'Utility' },
  hide: { 'zh-tw': '收起', en: 'Hide' },
  pieces: { 'zh-tw': '件', en: 'pc' },
  needMore: { 'zh-tw': '再 {n} 件解鎖 {p} 件加成', en: '{n} more for the {p}-piece bonus' },
  capped: { 'zh-tw': '已達上限', en: 'capped' },
  skills: { 'zh-tw': '技能', en: 'Skills' },
  skillSlot: { 'zh-tw': '技能 {n}', en: 'Skill {n}' },
  skillTier: { 'zh-tw': '技能階', en: 'Skill tier' },
  skillTierWasted: { 'zh-tw': '超出 {n} 階，多出的黃色核心沒有作用', en: '{n} over the cap — those yellow cores do nothing' },
  skillBonuses: { 'zh-tw': '技能加成', en: 'Skill bonuses' },
  skillOnly: { 'zh-tw': '僅限此技能', en: 'This skill only' },
  skillNoNumbers: {
    'zh-tw': '資料來源沒有技能的基礎數值（傷害、持續時間、冷卻），所以這裡只列出配裝提供的技能階與加成，不推算技能最終數值。',
    en: 'The data source has no base skill values (damage, duration, cooldown), so this lists the tier and bonuses your build provides rather than final skill numbers.',
  },
  dataBanner: {
    'zh-tw': '資料來源：div2hub/game-data (CC BY 4.0)。遊戲內容版權屬 Ubisoft 與 Massive Entertainment。非官方資料，請以遊戲內實際數值為準。',
    en: 'Data: div2hub/game-data (CC BY 4.0). Game content © Ubisoft and Massive Entertainment. Unofficial — verify against the game.',
  },
  navBuild: { 'zh-tw': '配裝', en: 'Build' },
  navLoot: { 'zh-tw': '每日戰利品', en: 'Daily loot' },
  lootTitle: { 'zh-tw': '今日目標戰利品', en: 'Targeted loot today' },
  lootMissions: { 'zh-tw': '任務與目標戰利品', en: 'Missions and target loot' },
  lootCaches: { 'zh-tw': '升級行動補給商補給箱', en: 'Escalation Requisition vendor caches' },
  lootMission: { 'zh-tw': '任務', en: 'Mission' },
  lootTarget: { 'zh-tw': '目標戰利品', en: 'Target loot' },
  lootDate: { 'zh-tw': '日期', en: 'Date' },
  lootRotation: { 'zh-tw': '輪替', en: 'Rotation' },
  lootChecked: { 'zh-tw': '最後檢查', en: 'Last checked' },
  lootNext: { 'zh-tw': '下次更新', en: 'Next update' },
  lootLocal: { 'zh-tw': '本地時間 {t}', en: '{t} your time' },
  lootLoading: { 'zh-tw': '讀取今日資料中…', en: 'Loading today’s rotation…' },
  lootFailed: {
    'zh-tw': '無法取得今日資料，可能是來源暫時無法連線。可以直接到來源網站查看：',
    en: 'Couldn’t load today’s rotation — the source may be down. Check it directly:',
  },
  lootRetry: { 'zh-tw': '重試', en: 'Retry' },
  lootStale: {
    'zh-tw': '這份資料不是今天（UTC）的。來源約在 {t} 更新，在那之前顯示的是前一天的輪替。',
    en: 'This snapshot isn’t from today (UTC). The source updates around {t}; until then it shows the previous rotation.',
  },
  lootNotOk: { 'zh-tw': '來源標示的狀態：{s}', en: 'Source status: {s}' },
  lootBanner: {
    'zh-tw': '每日戰利品資料來源：Raigulus（每天自動檢查）。非官方資料，請以遊戲內為準。',
    en: 'Daily loot data: Raigulus (checked automatically each day). Unofficial — verify in game.',
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
  focus: {
    dps: { 'zh-tw': '輸出', en: 'DPS' },
    tank: { 'zh-tw': '坦克', en: 'Tank' },
    skill: { 'zh-tw': '技能', en: 'Skill' },
    support: { 'zh-tw': '支援', en: 'Support' },
  },
} as const;

const KEY = 'd2b.lang';

/** Storage and the DOM are absent under test, so both accesses are optional. */
const store: Pick<Storage, 'getItem' | 'setItem'> | null =
  typeof localStorage === 'undefined' ? null : localStorage;

let current: Lang = (store?.getItem(KEY) as Lang | null) ?? 'zh-tw';

export const lang = () => current;

export function setLang(next: Lang) {
  current = next;
  store?.setItem(KEY, next);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh-tw' ? 'zh-Hant' : 'en';
  }
}

type Entry = Record<Lang, string>;
const pick = (e: Entry) => e[current];

/** 取得介面文字 / Look up a top-level UI string. */
export const t = (key: keyof typeof UI): string => {
  const entry = UI[key];
  return typeof (entry as Entry)['zh-tw'] === 'string' ? pick(entry as Entry) : String(key);
};

export const tSlot = (slot: keyof typeof UI.slot) => pick(UI.slot[slot]);
export const tWeaponSlot = (s: keyof typeof UI.weaponSlot) => pick(UI.weaponSlot[s]);
export const tSpec = (s: keyof typeof UI.spec) => pick(UI.spec[s]);
/** Weapon types come from the data set, so an unknown one falls back to itself. */
export const tWeaponType = (name: string) =>
  (name in UI.weaponType ? pick(UI.weaponType[name as keyof typeof UI.weaponType]) : name);
export const tQuality = (q: keyof typeof UI.quality) => pick(UI.quality[q]);
export const tCategory = (c: keyof typeof UI.category) => pick(UI.category[c]);
export const tFocus = (f: keyof typeof UI.focus) => pick(UI.focus[f]);

/**
 * 屬性名 / Stat name in the active language, looked up by stat id. English is
 * the source of truth, so `fallback` (the dataset's own name) is used when a
 * Chinese name is missing rather than showing a raw id.
 */
export const tStat = (statId: string, fallback: string) =>
  current === 'zh-tw' ? STAT_ZH[statId] ?? fallback : fallback;

/** 品牌／套裝名 / Set name in the active language, falling back to English. */
/** 武器名 / Weapon name; only exotics have a sourced Chinese name so far. */
export const tWeapon = (name: string) => (current === 'zh-tw' ? ITEM_ZH[name] ?? name : name);

/**
 * 技能名 / Skill name in the active language. A variant with no entry of its
 * own is left in English whole, rather than half-translated.
 */
export const tSkill = (name: string) => (current === 'zh-tw' ? SKILL_ZH[name] ?? name : name);

export const tSet = (name: string) => (current === 'zh-tw' ? SET_ZH[name] ?? name : name);

/**
 * 天賦名 / Talent name in the active language. Only a minority have a sourced
 * Chinese name, so the English one stands in rather than a guessed rendering.
 */
export const tTalent = (name: string) =>
  (current === 'zh-tw' ? talentZh(name) ?? name : name);

/**
 * 裝備名 / Item name in the active language.
 *
 * Generic pieces are named `{Set} {Slot}` upstream, so they compose from the
 * set and slot translations rather than needing 396 individual entries. Named
 * and exotic items fall back to English until `ITEM_ZH` covers them.
 */
export function tItem(name: string, slot: string, setName: string | null) {
  if (current !== 'zh-tw') return name;
  const explicit = ITEM_ZH[name];
  if (explicit) return explicit;
  if (setName && name === `${setName} ${SLOT_EN[slot] ?? ''}`) {
    const zhSet = SET_ZH[setName];
    const zhSlot = SLOT_ZH[slot];
    // Brands that keep a Latin name need a space before the Chinese slot word.
    if (zhSet && zhSlot) return /[A-Za-z0-9]$/.test(zhSet) ? `${zhSet} ${zhSlot}` : `${zhSet}${zhSlot}`;
  }
  return name;
}

/** English slot words as they appear inside upstream item names. */
const SLOT_EN: Record<string, string> = {
  mask: 'Mask', chest: 'Chest', backpack: 'Backpack',
  gloves: 'Gloves', holster: 'Holster', knees: 'Kneepads',
};
