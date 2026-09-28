/**
 * 匯出譯名成 CSV / Dump the hand-maintained names for pasting into the sheet.
 *
 * One-way and one-off: once the sheet exists it is the source, and this exists
 * only to seed it without retyping 339 rows.
 */
import { writeFileSync } from 'node:fs';
import { ITEM_ZH } from '../src/i18n/names.ts';
import { STAT_ZH } from '../src/i18n/stats.ts';
import { TALENT_ZH } from '../src/i18n/talents.ts';
import { SKILL_ZH } from '../src/i18n/skills.ts';
import raw from '../src/data/generated/game-data.json' with { type: 'json' };

const rows: string[][] = [['kind', 'key', 'zh-tw']];
const add = (kind: string, map: Record<string, string>) => {
  for (const [k, v] of Object.entries(map).sort(([a], [b]) => a.localeCompare(b))) rows.push([kind, k, v]);
};
add('item', ITEM_ZH);
add('talent', TALENT_ZH);
add('stat', STAT_ZH);

// Skills have no built-in names yet, so every key goes out with whatever it
// has — mostly blank — giving the sheet a row to type into for each one.
// Blank cells are ignored on the way back in, so an unfilled row is harmless.
const skillKeys = new Set<string>();
for (const v of (raw as { skills: { name: string; skill: string }[] }).skills) {
  skillKeys.add(v.skill);
  skillKeys.add(v.name);
}
for (const k of [...skillKeys].sort()) rows.push(['skill', k, SKILL_ZH[k] ?? '']);

const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
writeFileSync('i18n-seed.csv', rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n', 'utf8');
console.log(`✓ i18n-seed.csv — ${rows.length - 1} rows (item/talent/stat/skill)`);
