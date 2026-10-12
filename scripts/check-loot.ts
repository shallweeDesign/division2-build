/**
 * 每日戰利品檢查 / Read today's loot snapshot the way the page does and report
 * anything the page cannot make sense of.
 *
 * Run daily by `.github/workflows/loot-check.yml` shortly after the 08:00 UTC
 * reset; a non-zero exit there opens (or updates) a GitHub issue, so a new
 * wording in the source is noticed before anyone meets an "Unrecognised" tag.
 *
 * It applies the Google Sheet overlay first, exactly as the page does, so an
 * `alias` row added there clears the alarm without a deploy.
 *
 * Writes a Markdown report to stdout. Exit 1: something needs a look.
 */
import { LOOT_PAGE, LOOT_URL, isStale, parseLoot } from '../src/model/loot.ts';
import { resolveLoot } from '../src/model/loot-vocab.ts';
import { loadOverrides } from '../src/i18n/overrides.ts';

const problems: string[] = [];
const notes: string[] = [];

await loadOverrides();

let raw: unknown = null;
try {
  // LOOT_URL in the environment points the check at a test file instead.
  const res = await fetch(process.env.LOOT_URL || LOOT_URL, { cache: 'no-store' });
  if (!res.ok) problems.push(`Fetching the snapshot failed: HTTP ${res.status}.`);
  else raw = await res.json();
} catch (e) {
  problems.push(`Fetching the snapshot failed: ${(e as Error).message}`);
}

const snap = raw === null ? null : parseLoot(raw);
if (raw !== null && !snap) {
  problems.push('The snapshot no longer has the shape the page expects (date + missions). The source format may have changed.');
}

if (snap) {
  const words = [
    ...snap.missions.map((m) => ({ where: `target at ${m.mission}`, word: m.loot })),
    ...snap.vendorCaches.map((c) => ({ where: `${c.type} vendor cache`, word: c.item })),
  ];
  const unknown = words.filter(({ word }) => resolveLoot(word).kind === 'unknown');
  for (const { where, word } of unknown) problems.push(`Unrecognised word **${word}** (${where}).`);

  if (isStale(snap)) notes.push(`The snapshot is still dated ${snap.date}; the source has not caught up with today's reset yet.`);
  if (snap.status && snap.status !== 'ok') notes.push(`The source reports status "${snap.status}".`);
}

const lines = [
  `Snapshot: ${snap ? `${snap.date} (checked ${snap.lastChecked || 'unknown'})` : 'unavailable'} — [source](${LOOT_PAGE})`,
  '',
  ...(problems.length ? ['### Needs a look', ...problems.map((p) => `- ${p}`), ''] : ['Everything on the page resolved.', '']),
  ...(notes.length ? ['### Notes', ...notes.map((n) => `- ${n}`), ''] : []),
  ...(problems.some((p) => p.startsWith('Unrecognised'))
    ? [
      '### How to fix',
      '- Fastest, no deploy: add a row to the Google Sheet — `alias | <the new word> | <a word the page knows>`,',
      '  e.g. `alias | Body Armor | Chest Pieces`. The page and this check pick it up on their next load.',
      '- Permanent: add the word to `SLOT_WORDS` / `WEAPON_WORDS` in `src/model/loot-vocab.ts`.',
      '',
    ]
    : []),
];
console.log(lines.join('\n'));
process.exit(problems.length ? 1 : 0);
