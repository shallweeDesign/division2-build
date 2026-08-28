/**
 * 計算規則常數 / Calculation rules.
 * These are game rules rather than data: they hold across versions, so unlike
 * the CSVs they are safe to hard-code.
 */

/** 技能分階上限 / Skill tier caps at 6; further yellow cores are wasted. */
export const SKILL_TIER_CAP = 6;

/** 屬性硬上限 / Hard caps on totalled stats, keyed by stat id. */
export const STAT_CAPS: Record<string, number> = {
  'critical-hit-chance': 60,
  'skill-tier': SKILL_TIER_CAP,
};

/** 品牌最多 3 件、套裝最多 4 件 / Pieces beyond these grant nothing further. */
export const MAX_PIECES = { brand: 3, gearset: 4 } as const;
