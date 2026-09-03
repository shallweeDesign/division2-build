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
import { TALENT_ZH } from './talents.ts';

/**
 * 試算表網址 / The published sheet, as `File → Share → Publish to web → CSV`.
 * Empty disables the overlay entirely, which is the state to leave it in if
 * the sheet ever goes away.
 */
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT90rli4ZWC-uiz9b5vP5qBQr7A0nPfPf_uTtPLi0NxEpMgvPQLZlJ5BtvqS582pFZLgtBB2cvTGFcG/pub?output=csv';

/** 放棄等待的時間 / Give up after this; the baked names are already on screen. */
const TIMEOUT_MS = 6000;

const TARGETS: Record<string, Record<string, string>> = {
  item: ITEM_ZH,
  talent: TALENT_ZH,
  stat: STAT_ZH,
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

/** 套用列 / Merge parsed rows over the baked maps. Exported for the tests. */
export function applyRows(rows: string[][]): OverrideResult {
  const [header, ...body] = rows;
  if (!header) return { applied: 0, unknownKinds: [] };

  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const kindAt = col('kind');
  const keyAt = col('key');
  const zhAt = col('zh-tw');
  if (kindAt < 0 || keyAt < 0 || zhAt < 0) return { applied: 0, unknownKinds: [] };

  let applied = 0;
  const unknown = new Set<string>();
  for (const r of body) {
    const kind = (r[kindAt] ?? '').trim();
    const key = (r[keyAt] ?? '').trim();
    const zh = (r[zhAt] ?? '').trim();
    if (!kind || !key || !zh) continue;          // an empty cell must not blank a name
    const target = TARGETS[kind];
    if (!target) { unknown.add(kind); continue; }
    target[key] = zh;
    applied += 1;
  }
  return { applied, unknownKinds: [...unknown] };
}

/**
 * 抓取並套用 / Fetch the sheet and lay it over the baked names.
 * Resolves to null when there is nothing to apply, for any reason at all.
 */
export async function loadOverrides(url = SHEET_URL): Promise<OverrideResult | null> {
  if (!url) return null;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: abort.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const result = applyRows(parseCsv(await res.text()));
    return result.applied > 0 ? result : null;
  } catch {
    return null;                                  // offline, blocked, slow, gone
  } finally {
    clearTimeout(timer);
  }
}
