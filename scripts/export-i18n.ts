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

const rows: string[][] = [['kind', 'key', 'zh-tw']];
const add = (kind: string, map: Record<string, string>) => {
  for (const [k, v] of Object.entries(map).sort(([a], [b]) => a.localeCompare(b))) rows.push([kind, k, v]);
};
add('item', ITEM_ZH);
add('talent', TALENT_ZH);
add('stat', STAT_ZH);

const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
writeFileSync('i18n-seed.csv', rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n', 'utf8');
console.log(`✓ i18n-seed.csv — ${rows.length - 1} rows (item/talent/stat)`);
