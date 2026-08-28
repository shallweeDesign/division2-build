/**
 * 屬性名稱中譯 / Traditional Chinese stat names, keyed by the stat id from
 * stats.csv. A test asserts this map stays exhaustive, so a stat added upstream
 * fails the build instead of rendering in English inside a Chinese UI.
 */
export const STAT_ZH: Record<string, string> = {
  // 武器傷害 / Weapon damage
  'weapon-damage': '武器傷害',
  'assault-rifle-damage': '突擊步槍傷害',
  'lmg-damage': '輕機槍傷害',
  'smg-damage': '衝鋒槍傷害',
  'rifle-damage': '步槍傷害',
  'marksman-rifle-damage': '射手步槍傷害',
  'shotgun-damage': '霰彈槍傷害',
  'pistol-damage': '手槍傷害',
  'signature-weapon-damage': '特有武器傷害',
  'melee-damage': '近戰傷害',
  'explosive-damage': '爆裂物傷害',
  'electronic-damage': '電擊傷害',
  'burn-damage': '燃燒傷害',

  // 增傷條件 / Conditional damage
  'health-damage': '對生命值傷害',
  'damage-to-armor': '對裝甲傷害',
  dtoc: '對脫離掩體目標傷害',
  'critical-hit-chance': '爆擊機率',
  'critical-hit-damage': '爆擊傷害',
  'headshot-damage': '爆頭傷害',

  // 武器操作 / Weapon handling
  'weapon-handling': '武器控制力',
  'magazine-size': '彈匣容量',
  'ammo-capacity': '彈藥容量',
  'swap-speed': '切換速度',
  'reload-speed': '裝彈速度',
  stability: '穩定度',
  accuracy: '準確度',
  'optimal-range': '有效射程',
  'rate-of-fire': '射速',

  // 防禦 / Defensive
  armor: '裝甲值',
  'total-armor': '總裝甲值',
  'armor-regeneration': '裝甲回復',
  'armor-on-kill': '擊殺時回復裝甲',
  health: '生命值',
  'health-on-kill': '擊殺時回復生命值',
  'damage-resistance': '傷害抗性',
  'hazard-protection': '危害防護',
  'explosive-resistance': '爆炸抗性',
  'protection-from-elites': '對菁英的防禦',
  'incoming-repairs': '受到治療',
  'outgoing-healing': '治療輸出',

  // 狀態抗性 / Status resistances
  'shock-resistance': '電擊抗性',
  'disrupt-resistance': '干擾抗性',
  'pulse-resistance': '脈衝抗性',
  'burn-resistance': '燃燒抗性',
  'burn-duration': '燃燒持續時間',
  'bleed-resistance': '出血抗性',
  'blind-deaf-resistance': '致盲／致聾抗性',
  'disorient-resistance': '暈眩抗性',
  'ensnare-resistance': '纏繞抗性',

  // 威脅度 / Threat
  'increased-threat': '提升威脅度',
  'reduced-threat': '降低威脅度',

  // 技能 / Skills
  'skill-tier': '技能階級',
  'skill-haste': '技能加速',
  'skill-damage': '技能傷害',
  'skill-duration': '技能持續時間',
  'skill-efficiency': '技能效率',
  'skill-health': '技能生命值',
  'repair-skills': '修復技能',
  'status-effects': '狀態效果',
  'shield-health': '護盾生命值',
  'scanner-pulse-haste': '掃描脈衝加速',
};
