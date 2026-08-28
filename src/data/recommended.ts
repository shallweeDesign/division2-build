/**
 * 推薦套裝 / Starting-point builds.
 *
 * 這些是「起手範本」，不是最佳解——每一套只是把該套裝的核心玩法組出來，
 * 讓你有個能立刻上手、再自行微調的基礎。實際強度依版本與玩法而異。
 *
 * These are starting points, not optimal builds: each one assembles the core
 * identity of a gear set so you have something workable to tune from. Real
 * strength varies by patch and playstyle.
 *
 * Templates reference sets by name rather than item ids, so they keep resolving
 * when the dataset updates.
 */

export type Focus = 'dps' | 'tank' | 'skill' | 'support';

export interface RecommendedBuild {
  id: string;
  name: { 'zh-tw': string; en: string };
  summary: { 'zh-tw': string; en: string };
  focus: Focus;
  /** Sets to wear, in priority order; piece counts must total six or fewer. */
  sets: { name: string; pieces: number }[];
  /** Preferred core stat id; falls back to each set's own default. */
  core: string;
  /** Preferred minor stat ids, applied in order where a slot allows them. */
  minors: string[];
}

export const RECOMMENDED: RecommendedBuild[] = [
  {
    id: 'strikers-sustained',
    name: { 'zh-tw': '突襲者 · 持續輸出', en: "Striker's · Sustained DPS" },
    summary: {
      'zh-tw': '靠持續命中疊加「突襲者賭注」，越打越痛。適合彈匣大、射速快的武器。',
      en: "Stacks Striker's Gamble by landing hits, so damage ramps the longer you stay on target.",
    },
    focus: 'dps',
    sets: [{ name: "Striker's Battlegear", pieces: 4 }, { name: 'Providence Defense', pieces: 2 }],
    core: 'weapon-damage',
    minors: ['critical-hit-chance', 'critical-hit-damage', 'weapon-handling'],
  },
  {
    id: 'heartbreaker-ar',
    name: { 'zh-tw': '心碎者 · 突擊步槍', en: 'Heartbreaker · Assault Rifle' },
    summary: {
      'zh-tw': '爆頭施加脈衝，再對脈衝目標疊加傷害與加成裝甲，攻守兼備。',
      en: 'Headshots pulse the target, then hits on pulsed enemies stack damage and bonus armour.',
    },
    focus: 'dps',
    sets: [{ name: 'Heartbreaker', pieces: 4 }, { name: 'Fenris Group AB', pieces: 2 }],
    core: 'weapon-damage',
    minors: ['critical-hit-chance', 'critical-hit-damage', 'headshot-damage'],
  },
  {
    id: 'negotiator-crit',
    name: { 'zh-tw': '談判者困境 · 爆擊擴散', en: "Negotiator's · Crit Spread" },
    summary: {
      'zh-tw': '爆擊標記敵人，對其中一個爆擊會濺射到其他標記目標，適合群體作戰。',
      en: 'Crits mark enemies and damage spreads between the marks — strong against groups.',
    },
    focus: 'dps',
    sets: [{ name: "Negotiator's Dilemma", pieces: 4 }, { name: 'Sokolov Concern', pieces: 2 }],
    core: 'weapon-damage',
    minors: ['critical-hit-chance', 'critical-hit-damage'],
  },
  {
    id: 'hunters-fury-close',
    name: { 'zh-tw': '獵人怒火 · 近戰壓制', en: "Hunter's Fury · Close Quarters" },
    summary: {
      'zh-tw': '貼身作戰流，擊殺回復裝甲與生命值，配霰彈槍或衝鋒槍推進。',
      en: 'Aggressive close-range play: kills restore armour and health as you push with a shotgun or SMG.',
    },
    focus: 'dps',
    sets: [{ name: "Hunter's Fury", pieces: 4 }, { name: 'Ceska Vyroba s.r.o.', pieces: 2 }],
    core: 'weapon-damage',
    minors: ['critical-hit-chance', 'critical-hit-damage', 'total-armor'],
  },
  {
    id: 'umbra-cover',
    name: { 'zh-tw': '本影倡議 · 掩體爆擊', en: 'Umbra Initiative · Cover Crit' },
    summary: {
      'zh-tw': '在掩體後疊加爆擊傷害與射速，離開掩體則轉為裝甲回復，節奏感強。',
      en: 'Builds crit damage and rate of fire from cover, converting to armour regen once you leave it.',
    },
    focus: 'dps',
    sets: [{ name: 'Umbra Initiative', pieces: 4 }, { name: 'Providence Defense', pieces: 2 }],
    core: 'weapon-damage',
    minors: ['critical-hit-chance', 'critical-hit-damage'],
  },
  {
    id: 'eclipse-status',
    name: { 'zh-tw': '日蝕協定 · 狀態擴散', en: 'Eclipse Protocol · Status Spread' },
    summary: {
      'zh-tw': '狀態效果流：敵人帶著狀態死亡會傳染給附近目標，靠技能而非槍械輸出。',
      en: 'Status build: enemies dying under a status pass it to a nearby target. Damage comes from skills.',
    },
    focus: 'skill',
    sets: [{ name: 'Eclipse Protocol', pieces: 4 }, { name: 'China Light Industries', pieces: 2 }],
    core: 'skill-tier',
    minors: ['status-effects', 'skill-haste', 'skill-damage'],
  },
  {
    id: 'hardwired-skill',
    name: { 'zh-tw': '固線連結 · 技能循環', en: 'Hard Wired · Skill Cycling' },
    summary: {
      'zh-tw': '每次施放技能會重置另一個技能並提升技能傷害，技能幾乎不用等冷卻。',
      en: 'Using a skill resets the other and boosts skill damage, so cooldowns barely bite.',
    },
    focus: 'skill',
    sets: [{ name: 'Hard Wired', pieces: 4 }, { name: 'Empress International', pieces: 2 }],
    core: 'skill-tier',
    minors: ['skill-damage', 'skill-haste', 'repair-skills'],
  },
  {
    id: 'future-support',
    name: { 'zh-tw': '未來主動權 · 團隊支援', en: 'Future Initiative · Team Support' },
    summary: {
      'zh-tw': '滿裝甲時提升全隊武器與技能傷害，修復友軍時範圍外溢，組隊價值高。',
      en: 'Boosts the team while armour is full and spills healing to nearby allies. Built for groups.',
    },
    focus: 'support',
    sets: [{ name: 'Future Initiative', pieces: 4 }, { name: 'Alps Summit Armaments', pieces: 2 }],
    core: 'skill-tier',
    minors: ['repair-skills', 'skill-duration', 'skill-haste'],
  },
  {
    id: 'foundry-shield',
    name: { 'zh-tw': '鑄造廠堡壘 · 護盾坦克', en: 'Foundry Bulwark · Shield Tank' },
    summary: {
      'zh-tw': '護盾流坦克：受到的傷害會在數秒內回復，站得住才輸出得了。',
      en: 'Shield tank — a share of damage taken repairs itself over a few seconds.',
    },
    focus: 'tank',
    sets: [{ name: 'Foundry Bulwark', pieces: 4 }, { name: 'Gila Guard', pieces: 2 }],
    core: 'armor',
    minors: ['total-armor', 'armor-regeneration', 'hazard-protection'],
  },
  {
    id: 'aegis-survival',
    name: { 'zh-tw': '庇護 · 高生存', en: 'Aegis · Survivability' },
    summary: {
      'zh-tw': '被越多敵人鎖定、傷害抗性越高，適合吸引火力的前排位置。',
      en: 'Damage resistance scales with how many enemies target you — a front-line aggro build.',
    },
    focus: 'tank',
    sets: [{ name: 'Aegis', pieces: 4 }, { name: '5.11 Tactical', pieces: 2 }],
    core: 'armor',
    minors: ['total-armor', 'health', 'protection-from-elites'],
  },
];
