/**
 * 專精天賦譯名 / Specialization talent names and wording.
 *
 * 自譯 / Translated here from the English (2026-10-28): no in-game screenshot
 * or reference was at hand. Stat words follow the names already used for gear
 * and talents (武器控制力, 特有武器, 加成裝甲 …) so the pages read alike.
 *
 * Most wording is one of a few templates ("Increases X by N%"), so those are
 * matched by pattern; the rest are listed by their full English text.
 */

/** 節點名 / Hub, talent and equipment node names. `<Spec> Tactical Link` is composed. */
export const SPEC_NODE_ZH: Record<string, string> = {
  'Weapon Damage Hub': '武器傷害樞紐',
  'Skill Hub': '技能樞紐',
  'This is my Rifle': '這是我的步槍',
  'Depleted Rounds': '貧鈾彈',
  'E.M.I': '電磁干擾',
  Gunslinger: '快槍手',
  Onslaught: '猛攻',
  'Running the Gun': '邊跑邊打',
  'Spray and Pray': '盲目掃射',
  'Signature Weapon Damage': '特有武器傷害',
  'Signature Ammo Acquisition': '特有武器彈藥獲取',
  'Group Signature Ammo Acquisition': '團隊特有武器彈藥獲取',
  'Vital Protection': '要害防護',
  // 爆破手 / Demolitionist
  'Explosive Ordnance': '爆裂軍械',
  Incombustible: '不燃',
  'Stimulant Patch': '興奮劑貼片',
  'Crisis Response': '危機應變',
  'Braced for Impact': '準備迎擊',
  // 防火牆 / Firewall
  'Frontline Recovery': '前線恢復',
  'Extracellular Matrix Mesh': '細胞外基質網',
  'Enriched Magnesium Formula': '濃縮鎂配方',
  'Bull Rush': '蠻牛衝撞',
  'Fiery Response': '烈火回應',
  // 機槍手 / Gunner
  Incessant: '持續不斷',
  Coupler: '聯結器',
  'Hardened Armor Kits': '強化裝甲包',
  'Supply Line': '補給線',
  Emplacement: '陣地',
  Barrage: '彈幕',
  // 神射手 / Sharpshooter
  'One in the Head': '一槍爆頭',
  'Breath Control': '呼吸控制',
  'Emergency Cleanse': '緊急淨化',
  'Round After Round': '一發接一發',
  'My Home is My Castle': '堅守陣地',
  // 生存者 / Survivalist
  'Triage Specialist': '檢傷分類專家',
  'Elite Defense': '菁英防禦',
  'Distributed Repair': '分散修復',
  'Crunch Time': '緊要關頭',
  'Scraping By': '勉強度日',
  // 技術員 / Technician
  Amped: '增幅',
  Dismantling: '拆解',
  'Emergency Patch': '緊急修補',
  'Faraday Field': '法拉第力場',
  Technomancy: '科技術法',
  'Overclocked CPU': '超頻 CPU',
  'Enhanced Diagnostics': '強化診斷',

  // 專精配備 / Spec equipment: grenade, signature weapon, and the skill parts the
  // tree unlocks. Sidearms reuse their weapon names (see `tSpecNode`); P320
  // XCompact and Maxim 9 keep their English names, as in game.
  'Fragmentation Grenade': '破片手榴彈',
  'Cluster Grenade': '集束手榴彈',
  'Riot Foam Grenade': '鎮暴泡沫手榴彈',
  'Flashbang Grenade': '閃光彈',
  'Incendiary Grenade': '燃燒手榴彈',
  'EMP Grenade': 'EMP 手榴彈',
  Artillery: '火砲',
  Striker: '突擊者',
  Banshee: '女妖',
  Tactician: '戰術家',
  Mender: '修補者',
  Artificer: '工匠',
  'Sharpshooters 93R': '精準射手 93R',
  'Cyclone Magazine': '旋風彈匣',
  'SHD CPU V2': 'SHD CPU V2',
  'Shock Hardened Frame': '抗電擊強化框架',
  'Macromolecular Coverings': '巨分子覆層',
  'Microwave Amplifier': '微波放大器',
  'Directional Transmitter': '定向發射器',
  'Graphene Battery': '石墨烯電池',
  'Carbon Fiber Frame': '碳纖維框架',
  'Magnetic Disc': '磁性圓盤',
  'Larrea Tridentata': '三齒拉瑞阿',
  'Upgraded Sensor': '升級感測器',
  'Liquid Cooling': '液體冷卻',
};

/** 屬性名 / The stat in "Increases <stat> by N%". */
const STAT: Record<string, string> = {
  Stability: '穩定度',
  'Marksman Rifle Damage': '射手步槍傷害',
  'Assault Rifle Damage': '突擊步槍傷害',
  'Pistol Damage': '手槍傷害',
  'LMG Damage': '輕機槍傷害',
  'Shotgun Damage': '霰彈槍傷害',
  'SMG Damage': '衝鋒槍傷害',
  'Rifle Damage': '步槍傷害',
  'Signature Weapon Damage': '特有武器傷害',
  'Pulse Resistance': '脈衝抗性',
  'Protection from Elites': '菁英敵人防護',
  'Outgoing Healing': '治療效果',
  'Explosive Damage': '爆炸傷害',
  'Armor on Kill': '擊殺回復裝甲',
  'Burn Duration': '燃燒持續時間',
  'Health on Kill': '擊殺回復生命值',
};

const PATTERNS: [RegExp, (...m: string[]) => string | undefined][] = [
  [/^Increases? (.+) by (\d+)%$/, (s, n) => (STAT[s!] ? `${STAT[s!]} +${n}%` : undefined)],
  [/^Increased headshot damage by (\d+)% with Rifles and Marksman Rifles$/, (n) => `步槍與射手步槍的爆頭傷害 +${n}%`],
  [/^Extra damage to drones, skill proxies, and robotics — (\d+)%$/, (n) => `對無人機、技能物件與機器人的傷害 +${n}%`],
  [/^Every (\d)(?:st|nd|rd|th) reload is 50% faster$/, (n) => `每第 ${n} 次裝彈速度加快 50%`],
];

/** 其餘說明 / Wording that fits no template, keyed by the full English text. */
const TEXT: Record<string, string> = {
  'Armor kits repair 100%, remove status effects and increases resistance to bleed, poison, and burn for 20s':
    '裝甲包修復 100% 裝甲並清除狀態效果，20 秒內提升出血、中毒與燃燒抗性。',
  'Killing enemies with headshots adds 1 to your groups ammo bar, excluding kills with the spec weapon':
    '爆頭擊殺敵人時，隊伍的特有武器彈藥條 +1（特有武器擊殺不計）。',
  'Bonus armor gained while in cover': '在掩體後時獲得加成裝甲。',
  'After 20 seconds in cover, you start generating 5 MMR and 5 Rifle ammo every 10 seconds':
    '在掩體後超過 20 秒後，每 10 秒產生 5 發射手步槍與 5 發步槍彈藥。',
  'All group members that are closer to enemies than you get +10% headshot damage':
    '比你更靠近敵人的隊友獲得爆頭傷害 +10%。',
  'Killing enemies with headshots adds 2 to the ammo bar, excluding kills with the spec weapon':
    '爆頭擊殺敵人時，特有武器彈藥條 +2（特有武器擊殺不計）。',
  'While in cover, gain 10% skill haste': '在掩體後時技能加速 +10%。',
  'Armor kits now repair over 5 seconds instead of instantly, but also apply to group members within 20 meters':
    '裝甲包改為在 5 秒內逐步修復，但也會作用於 20 公尺內的隊友。',
  'Killing enemies under status effects adds 3 to your groups ammo bar, excluding kills with the spec weapon':
    '擊殺受狀態效果影響的敵人時，隊伍的特有武器彈藥條 +3（特有武器擊殺不計）。',
  'Gain 5 ammo per second for your current weapon while performing a cover-to-cover in combat':
    '戰鬥中進行掩體間移動時，目前武器每秒獲得 5 發彈藥。',
  'Killing enemies under status effects adds 3 to the ammo bar, excluding kills with the spec weapon':
    '擊殺受狀態效果影響的敵人時，特有武器彈藥條 +3（特有武器擊殺不計）。',
  'Group members get 10% bonus damage to targets with status effects': '隊友對受狀態效果影響的目標傷害 +10%。',
  'Ignore explosions. Can only trigger once every 60 seconds': '無視爆炸。每 60 秒只能觸發一次。',
  'When armor is reduced to 0, refills all main weapon clip ammo': '裝甲歸零時，補滿主要武器的彈匣。',
  'Group members gain 5% damage to targets out of cover': '隊友對不在掩體後的目標傷害 +5%。',
  "Killing enemies with explosions adds 2 to your groups ammo bar, excluding kills with the spec weapon":
    '以爆炸擊殺敵人時，隊伍的特有武器彈藥條 +2（特有武器擊殺不計）。',
  'Increase Burn Resistance by 20%': '燃燒抗性 +20%',
  'Killing enemies with explosions adds 3 to the ammo bar, excluding kills with the spec weapon':
    '以爆炸擊殺敵人時，特有武器彈藥條 +3（特有武器擊殺不計）。',
  'Armor kits repair 100% damage and boost weapon handling by 30% for 15s':
    '裝甲包修復 100% 裝甲，並使武器控制力 +30%，持續 15 秒。',
  'Rate of fire increases by 5% on kill for 5s': '擊殺時射速 +5%，持續 5 秒。',
  '10% weapon handling while not moving, need to be motionless for 1 second':
    '靜止不動 1 秒後，武器控制力 +10%。',
  "Killing multiple enemies without releasing the trigger adds 1 to group members' ammo bar, excluding kills with the spec weapon":
    '不放開扳機連續擊殺多名敵人時，隊友的特有武器彈藥條 +1（特有武器擊殺不計）。',
  'Armor kits repair 100% armor and grant 30% bonus armor for 10 seconds':
    '裝甲包修復 100% 裝甲，並給予 30% 加成裝甲，持續 10 秒。',
  'Killing multiple enemies without releasing the trigger adds 3 to the ammo bar, excluding kills with the spec weapon':
    '不放開扳機連續擊殺多名敵人時，特有武器彈藥條 +3（特有武器擊殺不計）。',
  'Generate 10% of total ammo capacity every 60 seconds. Party members recover 5%':
    '每 60 秒產生總彈藥量的 10%，隊友回復 5%。',
  '+1 Skill Tier': '技能階級 +1',
  'Armor kit also applies to all friendly skill proxies within 10m': '裝甲包也會作用於 10 公尺內所有友方技能物件。',
  '+10% Repair Skills': '修復技能 +10%',
  'Party members within 5m of your deployed and un-disrupted skills are immune to shock and disruption':
    '在你已部署且未受干擾的技能 5 公尺內的隊友，免疫電擊與干擾。',
  'Destroying hostile skill proxies and drones and robotics adds 1 to the ammo bar of your group':
    '摧毀敵方技能物件、無人機或機器人時，隊伍的特有武器彈藥條 +1。',
  '+10% Skill Damage': '技能傷害 +10%',
  'Destroying hostile skill proxies and drones and robotics adds 3 to the ammo bar':
    '摧毀敵方技能物件、無人機或機器人時，特有武器彈藥條 +3。',
  'Gain 15% bonus armor while aiming a skill': '瞄準技能時獲得 15% 加成裝甲。',
  '+30% Bonus Armor during cover to cover moves': '掩體間移動時加成裝甲 +30%。',
  'Your armor kit recovers 200% armor and 200% health over 10 seconds':
    '裝甲包在 10 秒內回復 200% 裝甲與 200% 生命值。',
  'On armor break, apply burn to enemies within 5m': '裝甲被打破時，使 5 公尺內的敵人燃燒。',
  'Allies deal +10% damage to enemies that are within 10 meters of you': '隊友對你 10 公尺內的敵人傷害 +10%。',
  'Killing enemies within 10 meters adds 1 to your groups ammo bar, excluding kills with the spec weapon':
    '擊殺 10 公尺內的敵人時，隊伍的特有武器彈藥條 +1（特有武器擊殺不計）。',
  'Killing enemies within 10 meters adds 3 to your ammo bar, excluding kills with the spec weapon':
    '擊殺 10 公尺內的敵人時，你的特有武器彈藥條 +3（特有武器擊殺不計）。',
};

/** 專精天賦說明 / A spec talent's wording in Chinese, or undefined if none. */
export function specTextZh(en: string): string | undefined {
  if (TEXT[en]) return TEXT[en];
  for (const [re, fmt] of PATTERNS) {
    const m = re.exec(en);
    if (m) { const out = fmt(...m.slice(1)); if (out) return out; }
  }
  return undefined;
}
