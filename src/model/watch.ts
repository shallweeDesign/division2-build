/**
 * SHD 手錶 / The SHD Watch: the sixteen stats a player levels outside their gear.
 *
 * The watch is filled in as the bonus the game already shows on the watch
 * screen, not as points invested. Points would be the better planning tool —
 * "what does 20 more into crit damage buy me" — but the per-point value of each
 * node is not published anywhere we could verify, and the upstream data set
 * carries no watch data at all. Asking for a number the player can read off
 * their own screen keeps every figure in this app sourced.
 *
 * Every id below is a real row in stats.csv, so watch bonuses land in the same
 * buckets as gear and set bonuses and obey the same caps (crit chance included).
 */
import type { Category } from './types.ts';

export interface WatchStat {
  statId: string;
  /** Which of the watch's four nodes this stat sits under. */
  node: WatchNode;
}

export type WatchNode = 'offensive' | 'defensive' | 'handling' | 'utility';

export const WATCH_NODES: readonly WatchNode[] = ['offensive', 'defensive', 'handling', 'utility'];

/** Node colours reuse the gear categories; handling has no gear equivalent. */
export const NODE_CATEGORY: Record<WatchNode, Category | null> = {
  offensive: 'offensive',
  defensive: 'defensive',
  handling: null,
  utility: 'skill',
};

export const WATCH_STATS: readonly WatchStat[] = [
  { node: 'offensive', statId: 'weapon-damage' },
  { node: 'offensive', statId: 'headshot-damage' },
  { node: 'offensive', statId: 'critical-hit-chance' },
  { node: 'offensive', statId: 'critical-hit-damage' },

  { node: 'defensive', statId: 'health' },
  { node: 'defensive', statId: 'total-armor' },
  { node: 'defensive', statId: 'hazard-protection' },
  { node: 'defensive', statId: 'explosive-resistance' },

  { node: 'handling', statId: 'accuracy' },
  { node: 'handling', statId: 'stability' },
  { node: 'handling', statId: 'ammo-capacity' },
  { node: 'handling', statId: 'reload-speed' },

  { node: 'utility', statId: 'repair-skills' },
  { node: 'utility', statId: 'skill-damage' },
  { node: 'utility', statId: 'skill-duration' },
  { node: 'utility', statId: 'skill-haste' },
];

export const WATCH_STAT_IDS: readonly string[] = WATCH_STATS.map((w) => w.statId);

export const watchStatsOf = (node: WatchNode) => WATCH_STATS.filter((w) => w.node === node);

/** 一個節點 50 點滿 / Each node caps at 50 points, so 800 levels max the watch. */
export const POINTS_PER_STAT = 50;
export const WATCH_STAT_COUNT = WATCH_STATS.length;
