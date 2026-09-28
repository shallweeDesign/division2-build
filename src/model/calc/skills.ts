/**
 * 技能 / What the build brings to its two skills.
 *
 * The dataset names every skill variant but carries no numbers for any of
 * them — no base damage, duration, cooldown or healing per tier. So this does
 * not, and cannot, say how hard a turret hits. What it can say, entirely from
 * data, is the part the gear decides: the skill tier the yellow cores reach
 * and the skill bonuses the build has stacked. Those are the numbers a player
 * reads off their own screen to judge a skill build anyway.
 */
import type { GameData, SkillVariant } from '../types.ts';
import type { BuildState } from '../build.ts';
import type { StatTotal } from './index.ts';
import { computeBuild } from './index.ts';
import { SKILL_TIER_CAP } from './constants.ts';

/** 通用技能屬性 / Bonuses that apply to every skill, in display order. */
export const SKILL_STAT_IDS = [
  'skill-damage',
  'repair-skills',
  'skill-haste',
  'skill-duration',
  'skill-health',
  'skill-efficiency',
  'status-effects',
] as const;

/**
 * 單一技能專屬屬性 / Stats that only touch one skill, so they are shown only
 * when that skill is equipped. Matched on the parent skill, or on one variant
 * when the stat names a variant.
 */
export const SKILL_SPECIFIC: Record<string, { skill?: string; variant?: string }> = {
  'shield-health': { skill: 'Shield' },
  'scanner-pulse-haste': { variant: 'Scanner Pulse' },
};

export interface EquippedSkill {
  variant: SkillVariant;
  /** Bonuses that apply to this skill alone, beyond the general ones. */
  specific: StatTotal[];
}

export interface SkillSummary {
  /** Tier after the cap, the raw sum, and what the cap threw away. */
  tier: { value: number; raw: number; wasted: number };
  /** Positional: `null` where the slot is empty. */
  equipped: (EquippedSkill | null)[];
  /** Every general skill bonus, zero included, so gaps are visible. */
  stats: StatTotal[];
  warnings: string[];
}

const zero = (statId: string): StatTotal =>
  ({ statId, value: 0, raw: 0, capped: false, percent: true, contributions: [] });

export function computeSkills(data: GameData, build: BuildState): SkillSummary {
  const totals = new Map(computeBuild(data, build).stats.map((s) => [s.statId, s]));
  const byName = new Map(data.skills.map((v) => [v.name, v]));

  const tierStat = totals.get('skill-tier');
  const raw = tierStat?.raw ?? 0;
  const value = Math.min(raw, SKILL_TIER_CAP);

  const equipped = (build.skills ?? []).map((name): EquippedSkill | null => {
    const variant = name ? byName.get(name) : undefined;
    if (!variant) return null;
    const specific = Object.entries(SKILL_SPECIFIC)
      .filter(([, m]) => (m.variant ? m.variant === variant.name : m.skill === variant.skill))
      .map(([statId]) => totals.get(statId) ?? zero(statId));
    return { variant, specific };
  });

  // The game will not equip two variants of one skill. The panel prevents it,
  // but a build can arrive from elsewhere (a template, later a shared link).
  const warnings: string[] = [];
  const parents = equipped.filter((e) => e !== null).map((e) => e!.variant.skill);
  const dupes = [...new Set(parents.filter((p, i) => parents.indexOf(p) !== i))];
  for (const p of dupes) {
    warnings.push(`${p}：同一技能只能裝一種變體 / only one ${p} variant can be equipped`);
  }

  return {
    tier: { value, raw, wasted: raw - value },
    equipped,
    stats: SKILL_STAT_IDS.map((id) => totals.get(id) ?? zero(id)),
    warnings,
  };
}
