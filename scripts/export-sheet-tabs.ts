/**
 * 匯出階層分頁 / Lay the names out for the sheet the way the planner shows them.
 *
 * Writes four TSV files — 武器, 裝備, 可選天賦, 技能 — ready to paste into tabs of
 * the same names. Rows follow the cards: weapon type → model → name, and slot →
 * brand → piece, each with its talent and that talent's wording beside it.
 *
 * Current names are filled in, including what the live sheet already holds, so
 * the tabs start from what the site shows. A talent that repeats down a tab is
 * written once; later rows point at the first with a formula, so changing that
 * one cell changes them all.
 *
 * One-off, like `export-i18n.ts`: once pasted, the sheet is the source.
 */
import { writeFileSync } from 'node:fs';
import { ITEM_ZH, SET_ZH, SLOT_ZH } from '../src/i18n/names.ts';
import { TALENT_TEXT_ZH, talentZh } from '../src/i18n/talents.ts';
import { SKILL_ZH } from '../src/i18n/skills.ts';
import { loadOverrides } from '../src/i18n/overrides.ts';
import { GEAR_LAYOUT } from '../src/model/types.ts';
import type { GameData, GearItem, Weapon } from '../src/model/types.ts';
import raw from '../src/data/generated/game-data.json' with { type: 'json' };

const data = raw as unknown as GameData;
await loadOverrides();

const TYPE_ZH: Record<string, string> = {
  'Assault Rifle': '突擊步槍', SMG: '衝鋒槍', LMG: '輕機槍', Rifle: '步槍',
  'Marksman Rifle': '射手步槍', Shotgun: '霰彈槍', Pistol: '手槍',
};
const TYPE_ORDER = Object.keys(TYPE_ZH);
const SLUG_TYPE: Record<string, string> = {
  'assault-rifle': 'Assault Rifle', smg: 'SMG', lmg: 'LMG', rifle: 'Rifle',
  'marksman-rifle': 'Marksman Rifle', shotgun: 'Shotgun', pistol: 'Pistol',
};
const SLOT_EN: Record<string, string> = {
  mask: 'Mask', chest: 'Chest', backpack: 'Backpack', gloves: 'Gloves', holster: 'Holster', knees: 'Kneepads',
};

const talentText = new Map([...data.gearTalents, ...data.weaponTalents].map((t) => [t.name, t.description]));

/**
 * One tab. `keyCol` is the 0-based column of a name that repeats down the tab
 * (a talent, a parent skill), and `zhCols` the columns translating it. The
 * first row with a name owns those cells; later rows reference them.
 */
function tab(file: string, header: string[], rows: string[][], keyCol: number, zhCols: number[]) {
  const first = new Map<string, number>();
  const letter = (i: number) => String.fromCharCode(65 + i);
  rows.forEach((r, i) => {
    const name = r[keyCol];
    if (!name) return;
    const sheetRow = i + 2;                       // 1-based, after the header
    const owner = first.get(name);
    if (owner === undefined) { first.set(name, sheetRow); return; }
    // `&""` keeps a blank owner blank; a bare `=F5` would show and publish 0.
    for (const c of zhCols) r[c] = `=${letter(c)}${owner}&""`;
  });
  // Tabs and newlines inside a cell would break the paste.
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ');
  writeFileSync(file, [header, ...rows].map((r) => r.map(clean).join('\t')).join('\n') + '\n', 'utf8');
  console.log(`✓ ${file} — ${rows.length} rows`);
}

const talentCells = (name: string | null) =>
  name ? [name, talentZh(name) ?? '', talentText.get(name) ?? '', TALENT_TEXT_ZH[name] ?? ''] : ['', '', '', ''];

// 武器 / Weapons: type → model → name, regular before named before exotic.
const rank = (x: { isNamed: boolean; isExotic: boolean }) => (x.isExotic ? 2 : x.isNamed ? 1 : 0);
const weapons = [...data.weapons].sort((a, b) =>
  TYPE_ORDER.indexOf(a.weaponType) - TYPE_ORDER.indexOf(b.weaponType)
  || a.family.localeCompare(b.family) || rank(a) - rank(b) || a.name.localeCompare(b.name));
tab('sheet-weapons.tsv',
  ['種類 type', '型號 model', '名稱 name', '名稱中文 name-zh', '固有天賦 talent', '天賦中文 talent-zh', '天賦內容 text', '內容中文 text-zh'],
  weapons.map((w: Weapon) => [
    TYPE_ZH[w.weaponType] ?? w.weaponType, w.family, w.name, ITEM_ZH[w.name] ?? '',
    ...talentCells(w.talent?.mode === 'fixed' ? w.talent.name : null),
  ]),
  4, [5, 7]);

// 裝備 / Gear: slot → brand → piece, every piece. A plain brand piece's
// Chinese name is the composed one the site already shows.
const EXOTIC = '奇特';
const groupOf = (i: GearItem) => i.brandSet ?? i.gearSet ?? null;
const kindRank = (i: GearItem) => (i.isExotic ? 2 : i.gearSet ? 1 : 0);
const pieceZh = (i: GearItem, slot: string) => {
  if (ITEM_ZH[i.name]) return ITEM_ZH[i.name]!;
  const set = groupOf(i);
  const zhSet = set ? SET_ZH[set] : undefined;
  if (!set || !zhSet || i.name !== `${set} ${SLOT_EN[slot]}`) return '';
  return /[A-Za-z0-9]$/.test(zhSet) ? `${zhSet} ${SLOT_ZH[slot]}` : `${zhSet}${SLOT_ZH[slot]}`;
};
tab('sheet-gear.tsv',
  ['部位 slot', '品牌 brand', '型號 name', '型號中文 name-zh', '天賦 talent', '天賦中文 talent-zh', '天賦內容 text', '內容中文 text-zh'],
  GEAR_LAYOUT.flatMap((slot) => data.gear[slot]
    .sort((a, b) => kindRank(a) - kindRank(b)
      || (groupOf(a) ?? '').localeCompare(groupOf(b) ?? '') || rank(a) - rank(b) || a.name.localeCompare(b.name))
    .map((i) => {
      const set = groupOf(i);
      return [
        SLOT_ZH[slot]!, set ? SET_ZH[set] ?? set : EXOTIC, i.name, pieceZh(i, slot),
        ...talentCells(i.talent?.mode === 'fixed' ? i.talent.name : null),
      ];
    })),
  4, [5, 7]);

// 可選天賦 / Talents a player picks: chest and backpack, then each weapon type.
const forLabel = (slugs: string[]) =>
  slugs.map((s) => SLOT_ZH[s] ?? TYPE_ZH[SLUG_TYPE[s] ?? ''] ?? s).join('、');
const ORDER = ['chest', 'backpack', ...TYPE_ORDER.map((t) => Object.keys(SLUG_TYPE).find((k) => SLUG_TYPE[k] === t)!)];
const firstSlot = (slugs: string[]) => Math.min(...slugs.map((s) => ORDER.indexOf(s)).filter((n) => n >= 0));
const pickable = [...data.gearTalents, ...data.weaponTalents]
  .filter((t) => t.compatibility.length > 0)
  .sort((a, b) => firstSlot(a.compatibility) - firstSlot(b.compatibility) || a.name.localeCompare(b.name));
tab('sheet-talents.tsv',
  ['適用 for', '天賦 talent', '天賦中文 talent-zh', '天賦內容 text', '內容中文 text-zh'],
  pickable.map((t) => [forLabel(t.compatibility), ...talentCells(t.name)]),
  1, [2, 4]);

// 技能 / Skills: each parent skill, then its variants.
tab('sheet-skills.tsv',
  ['技能 skill', '技能中文 skill-zh', '變體 variant', '變體中文 variant-zh'],
  data.skills.map((v) => [v.skill, SKILL_ZH[v.skill] ?? '', v.name, SKILL_ZH[v.name] ?? '']),
  0, [1]);
