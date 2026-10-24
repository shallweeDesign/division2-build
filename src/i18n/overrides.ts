/**
 * 線上譯名 / Names pulled from a Google Sheet at runtime.
 *
 * The names baked into the bundle are the ones that ship; this fetches a sheet
 * afterwards and lays whatever it finds on top. Editing a name is then editing
 * a spreadsheet row, with no build and no deploy.
 *
 * It is an overlay, never a replacement. Three things follow from that:
 *
 * The page renders from the baked names first and only re-renders if the fetch
 * lands. A cross-origin fetch to Google measured ~1.8s from the deployed site,
 * and no one should watch a blank panel for that.
 *
 * Nothing here throws. A sheet that is unpublished, renamed, rate-limited or
 * simply slow leaves the built-in names exactly as they were, which is the
 * whole point of keeping them.
 *
 * An empty cell is ignored rather than applied. Clearing a cell by accident
 * would otherwise blank a name on the live site, and a blank is worse than the
 * English it replaced.
 */
import { ITEM_ZH } from './names.ts';
import { STAT_ZH } from './stats.ts';
import { TALENT_TEXT_ZH, TALENT_ZH } from './talents.ts';
import { SKILL_ZH } from './skills.ts';
import { MISSION_ZH } from './loot.ts';
import { LOOT_ALIAS } from '../model/loot-vocab.ts';

/**
 * 試算表網址 / The published sheet (`File → Share → Publish to web`), and the
 * tabs read from it: 武器, 裝備, 可選天賦, 技能, by their `gid`. The original flat
 * `kind | key | zh-tw` tab was replaced by 武器 and is no longer read.
 * Empty `TAB_GIDS` disables the overlay entirely, which is the state to leave
 * it in if the sheet ever goes away.
 */
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT90rli4ZWC-uiz9b5vP5qBQr7A0nPfPf_uTtPLi0NxEpMgvPQLZlJ5BtvqS582pFZLgtBB2cvTGFcG/pub';
export const TAB_GIDS = ['0', '1776046889', '868500504', '56059846'];
export const TAB_URLS = TAB_GIDS.map((gid) => `${SHEET_URL}?gid=${gid}&single=true&output=csv`);

/** 放棄等待的時間 / Give up after this; the baked names are already on screen. */
const TIMEOUT_MS = 6000;

/**
 * Each `kind` the sheet may use. `alias` is the odd one out: its third column
 * is not a Chinese name but a word the loot page already knows — a row
 * `alias | Body Armor | Chest Pieces` teaches it a new wording for a slot.
 */
const TARGETS: Record<string, Record<string, string>> = {
  item: ITEM_ZH,
  talent: TALENT_ZH,
  stat: STAT_ZH,
  skill: SKILL_ZH,
  mission: MISSION_ZH,
  alias: LOOT_ALIAS,
};

/**
 * 解析 CSV / A real parser, not a split on commas: a Chinese name may contain
 * one, and a quoted field may contain a newline.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export interface OverrideResult {
  applied: number;
  /** Rows the sheet named that no map recognises — reported, not thrown. */
  unknownKinds: string[];
}

/**
 * 階層分頁的欄位 / Columns of the tabbed layout. Each header ends in a key word
 * after its Chinese label — `名稱中文 name-zh` — and only the key word is read,
 * so the label can be reworded freely.
 */
const TAB_COLUMNS: [source: string, zh: string, target: Record<string, string>][] = [
  ['name', 'name-zh', ITEM_ZH],
  ['talent', 'talent-zh', TALENT_ZH],
  ['talent', 'text-zh', TALENT_TEXT_ZH],
  ['skill', 'skill-zh', SKILL_ZH],
  ['variant', 'variant-zh', SKILL_ZH],
];

interface Candidate { target: Record<string, string>; key: string; zh: string }

/** `kind | key | zh-tw` rows, the original flat layout. */
function flatCandidates(header: string[], body: string[][], unknown: Set<string>): Candidate[] {
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const [kindAt, keyAt, zhAt] = [col('kind'), col('key'), col('zh-tw')];
  if (kindAt < 0 || keyAt < 0 || zhAt < 0) return [];
  return body.flatMap((r) => {
    const [kind, key, zh] = [r[kindAt], r[keyAt], r[zhAt]].map((c) => (c ?? '').trim());
    if (!kind || !key || !zh) return [];        // an empty cell must not blank a name
    const target = TARGETS[kind];
    if (!target) { unknown.add(kind); return []; }
    return [{ target, key, zh }];
  });
}

/** A row per weapon or piece, with its talent beside it. */
function tabCandidates(header: string[], body: string[][]): Candidate[] {
  const keyWord = (h: string) => h.trim().split(/\s+/).pop()!.toLowerCase();
  const col = (name: string) => header.findIndex((h) => keyWord(h) === name);
  return TAB_COLUMNS.flatMap(([source, zh, target]) => {
    const [srcAt, zhAt] = [col(source), col(zh)];
    if (srcAt < 0 || zhAt < 0) return [];
    return body.flatMap((r) => {
      const key = (r[srcAt] ?? '').trim();
      const value = (r[zhAt] ?? '').trim();
      return key && value ? [{ target, key, zh: value }] : [];
    });
  });
}

/**
 * 套用 / Merge every table over the baked maps. Exported for the tests.
 *
 * The same talent sits on many rows, so one key can arrive with different
 * values: the rows not yet updated still carry the old name. Whichever value
 * differs from what is already shown is the edit, and that one wins.
 */
export function applyTables(tables: string[][][]): OverrideResult {
  const unknown = new Set<string>();
  const byKey = new Map<Record<string, string>, Map<string, string[]>>();
  for (const [header, ...body] of tables) {
    if (!header) continue;
    for (const c of [...flatCandidates(header, body, unknown), ...tabCandidates(header, body)]) {
      const keys = byKey.get(c.target) ?? byKey.set(c.target, new Map()).get(c.target)!;
      keys.set(c.key, [...(keys.get(c.key) ?? []), c.zh]);
    }
  }

  let applied = 0;
  for (const [target, keys] of byKey) {
    for (const [key, values] of keys) {
      target[key] = values.find((v) => v !== target[key]) ?? values[0]!;
      applied += 1;
    }
  }
  return { applied, unknownKinds: [...unknown] };
}

/** One table on its own; the shape the flat sheet has always used. */
export const applyRows = (rows: string[][]) => applyTables([rows]);

/**
 * 抓取並套用 / Fetch the sheet and lay it over the baked names.
 * Resolves to null when there is nothing to apply, for any reason at all.
 */
export async function loadOverrides(
  urls: string | string[] = TAB_URLS,
): Promise<OverrideResult | null> {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (!list.length) return null;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  // Each tab fails on its own: one unpublished tab must not cost the others.
  const fetchOne = async (url: string) => {
    try {
      const res = await fetch(url, { signal: abort.signal, redirect: 'follow' });
      return res.ok ? parseCsv(await res.text()) : null;
    } catch {
      return null;                                // offline, blocked, slow, gone
    }
  };
  try {
    const tables = (await Promise.all(list.map(fetchOne))).filter((t): t is string[][] => t !== null);
    const result = applyTables(tables);
    return result.applied > 0 ? result : null;
  } finally {
    clearTimeout(timer);
  }
}
