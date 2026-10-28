/**
 * 天賦名稱中譯 / Traditional Chinese talent names.
 *
 * Every entry is matched by **numeric fingerprint**, not by reading the name.
 * The source lists each talent's current values, and those values line up with
 * `data/` exactly — Entrench at "below 30% armor, repair 20%, 2s cooldown",
 * Concussion at "10% for 1.5s, 5s with marksman rifles", Overwatch at "10s in
 * cover, 12%" — so a mapping is only kept when the numbers identify one talent
 * and no other. A name that merely reads like a translation is not enough.
 *
 * The source's parenthesised second value is the `Perfect` variant, which is
 * how the Perfect rows are derived rather than listed.
 *
 * ⚠ Only names are taken; descriptions keep coming from `data/`, which is the
 * data set the calculator is built on. Two other community sheets were checked
 * first and rejected as sources for anything but corroboration of a name: their
 * numbers predate the current game, disagree with each other (Berserk loses
 * armor "every 20%" in one and "every 10%" in the other), and they still list
 * talents the game has removed. Where those two disagreed with this one, this
 * one matched `data/` every time — Mad Bomber's grenade radius is +50% here and
 * in the game data, against +150% in both of the others.
 *
 * 來源 / Source: 「The Division 2 資料庫」, a Traditional Chinese community
 * reference (Discord schwarz333). Read on screen for terminology only; the
 * owner has download and copy switched off, so nothing was exported from it.
 */

import { TALENT_TEXT } from './talent-text.ts';

/**
 * 武器天賦 / Weapon talents. Not shown anywhere yet — the weapons UI is Phase 3 —
 * but named here while the source was open, on the same terms as the rest.
 */
const WEAPON: Record<string, string> = {
  'Behind You': '後顧之憂',
  'Boomerang': '迴力鏢',
  'Brazen': '彈丸風暴',
  'Breadbasket': '麵包籃',
  'Close & Personal': '短兵相接',
  'Eyeless': '失明',
  'Fast Hands': '快手族',
  'Finisher': '終結者',
  'First Blood': '第一滴血',
  'Frenzy': '瘋狂',
  'Future Perfect': '未來完成式',
  'Ignited': '點燃',
  'Killer': '殺手',
  'Lucky Shot': '幸運一擊',
  'Measured': '精密計算',
  'Naked': '赤身裸體',
  'Near Sighted': '短視近利',
  'On Empty': '空無一物',
  'Optimist': '樂天派',
  'Outsider': '局外人',
  'Overflowing': '滿溢',
  'Overwhelm': '排山倒海',
  'Perpetuation': '長存',
  'Precision Strike': '精準突擊',
  'Preservation': '維護保存',
  'Pressure Point': '壓力點',
  'Pummel': '拳拳到肉',
  'Pumped Up': '充滿幹勁',
  'Ranger': '遊騎兵',
  // Added 2026-10-25, matched on the damage and duration values. Flatline's
  // reference lists 3 (2) kills where data/ has 4 (3); its 15% (20%) pulse
  // amplification identifies it regardless.
  'Determined': '堅定',
  'Flatline': '死亡平線',
  'In Sync': '同步傷害',
  'Sledgehammer': '大鎚',
  'Reformation': '改革',
  'Sadist': '虐待狂',
  'Salvage': '拾荒',
  'Soft Spot': '痛擊軟肋',
  'Spike': '刺擊',
  'Stabilize': '穩定射擊',
  'Steady Handed': '雙手沉穩',
  'Strained': '壓力使然',
  'Streamline': '精簡增傷',
  'Thunder Strike': '雷擊',
  'Unhinged': '精神錯亂',
  'Unwavering': '屹立不搖',
  'Vindictive': '報復之心',
  // From the owner's in-game screenshots (2026-10-27). Picked on weapons; the
  // Perfect forms derive from these.
  'Back and Forth': '反復動作',
  'Boiling Point': '沸點',
  'Head Scratcher': '搔頭者',
  'Immobilize': '定身痛擊',
  'Rifleman': '步槍兵',
  // Perfect stat talents on named weapons; no plain form exists to derive from.
  'Perfect Accurate': '完美百步穿楊',
  'Perfect Allegro': '完美快板',
  'Perfect Distance': '完美遠距射手',
  'Perfect Extra': '完美加大',
  'Perfect Jazz Hands': '完美爵士手',
  'Perfect Optimized': '完美最佳化',
  // Talents unique to one named weapon.
  'Blossom Harvest': '開花豐收',
  'Future Perfection': '未來完成式',
  'Hidden Rock': '雪中送亂',
  'Primer Rounds': '引火子彈',
  'Sport Mode': '疾速模式',
  'Swift': '迅捷快手',
  // 自譯 / Translated here from the English (2026-10-26): no screenshot shows
  // these. The sheet's talent-zh column overrides any.
  'Foam at the Mouth': '口吐白沫',
  'Refreshing': '清涼',
};


/**
 * 奇特武器天賦 / The talent bolted to each exotic weapon, read from the same
 * source's talent column next to the weapon it belongs to.
 *
 * Keyed by looking each weapon's talent up in the data set rather than by
 * writing the English name out: a first pass spelled eleven of them from the
 * Chinese and got all eleven wrong — Agitator's talent is Perturb, not
 * Antagonize — which the "every mapped name still exists" test caught.
 */
const EXOTIC: Record<string, string> = {
  'Actum Est': '蓋棺論定',
  'Adaptive Instincts': '適應本能',
  'Agonizing Bite': '痛苦齧咬',
  'Ardent': '高溫射擊',
  'Autentico': '實證可靠',
  'Big Game Hunter': '王牌獵人',
  'Binary Trigger': '雙向扳機',
  'Breathe Free': '自由呼吸',
  'Bullet Hell': '槍彈地獄',
  'Busy Little Bee': '辛勤小蜜蜂',
  'Caduceus': '雙蛇杖',
  'Capacitance': '技能電容',
  'Capitulate': '屈服',
  'Cover Shooter': '掩體槍手',
  'Disruptor Rounds': '干擾子彈',
  'Doctor Home': '醫生之家',
  "Dragon's Breath": '龍之息',
  'Electromagnetic Accelerator': '電磁加速器',
  'Faster Than Reloading': '快於換彈',
  'Full Stop': '完全停歇',
  'Gangland Hit': '結黨追擊',
  'Geri and Freki': '基立和庫力奇',
  'High Priority Target': '高優先頭號目標',
  'In Plain Sight': '一目了然',
  'Incessant Chatter': '喋喋不休',
  'Mosquito Song': '蚊曲',
  'Ortiz Assault Interface': '奧提茲突擊介面',
  'Pakhan': '帕坎',
  'Payment in Kind': '實物支付',
  'Perturb': '干擾',
  'Plague of the Outcasts': '流亡者的瘟疫',
  'Regicide': '弒君',
  'Restrained': '束縛解除',
  'Rule Them All': '連帶征服',
  'Sandman': '睡魔',
  'Septic Shock': '敗血休克',
  'Symbiosis': '共生',
  'The Trap': '標記陷阱',
  'Transfusion': '輸血',
  'Unnerve': '頹喪',
  // 2026-10-25, from the user's exotic lists: each talent sits beside its
  // item, and every item's name already matched ours, so the item pins the talent.
  "Eagle's Strike / Tenacity": '雄鷹突擊／堅持',
  'Liberty or Death': '不自由，毋寧死',
  'Shakedown': '確認並執行',
  "You can look...but you can't touch": '你只能看……但不能碰',
};

/** 奇特裝備天賦 / Exotic gear talents, matched the same way. */
const EXOTIC_GEAR: Record<string, string> = {
  'Ablative Nano-Plating': '隔離奈米鍍層',
  'Abridged': '天賦互連',
  'Alternating Current': '技能分流',
  'Bleeding Edge': '嗜血先鋒',
  'Bob and Weave': '閃轉騰挪',
  'Chemical Agent': '化學物質',
  'Combat Medic': '戰鬥軍醫',
  'Counter': '反制',
  'Defibrillator': '電擊器',
  "Dragon's Glare": '龍之怒視',
  'Escape Plan': '脫逃計畫',
  'Hoarder': '拾荒者',
  'Impervious': '不為所動',
  'Iron Grip': '鐵腕',
  'Kill Confirmed': '已確認擊殺',
  'One in the Hand... / ...Two in the Bag': '一個在手……／……兩個在包',
  'Ostracize': '孤立排擠',
  'Over the top': '超出標準',
  'Pack Instincts': '群體本能',
  'Parkour!': '跑酷',
  'Quick Draw': '快速拔槍',
  'Rebalance': '重新平衡',
  'Resourceful': '足智多謀',
  'Slotted': '欄位加成',
  'Smoke Screen': '煙幕',
  'Stand Your Ground': '砲火下的優雅',
  'Toxic Delivery': '有害快遞',
  'Transference Overclock': '超頻轉移',
  'Vicious Cycle': '凶狠循環',
  'Weakest Link': '致命菜雞',
};

/** 一般天賦 / Base talents, each confirmed against its values in `data/`. */
const GEAR: Record<string, string> = {
  // 攻擊 / Offensive
  Obliterate: '抹滅性破壞',
  Opportunistic: '投機取巧',
  Wicked: '惡人',
  Gunslinger: '槍神',
  Spotter: '探子',
  'Unstoppable Force': '無人能擋的力量',
  Concussion: '震盪',
  Vigilance: '警戒',
  Composure: '泰然自若',
  Focus: '專注',
  'Glass Cannon': '玻璃大砲',
  Headhunter: '獵頭者',
  Companion: '同伴',
  Versatile: '多才多藝',
  Intimidate: '威嚇',
  Braced: '鼓起勇氣',
  Trauma: '創傷',
  'Mad Bomber': '瘋狂炸彈客',

  // 防禦 / Defensive
  Unbreakable: '牢不可破',
  Entrench: '鞏固',
  Clutch: '猛抓者',
  Bloodsucker: '吸血生物',
  Efficient: '效率第一',
  'Protected Reload': '裝彈保護',
  Protector: '守護者',
  Vanguard: '先鋒',
  Leadership: '領導能力',
  Galvanize: '振奮',
  'Adrenaline Rush': '腎上腺素爆發',
  Safeguard: '安全護衛',

  // 技能 / Skill
  Skilled: '熟練',
  'Tech Support': '技術支援',
  Spark: '火花',
  'Combined Arms': '聯合武裝',
  'Kinetic Momentum': '動能量',
  'Shock and Awe': '震懾',
  Overclock: '超頻',
  Energize: '充能',
  Calculated: '精打細算',
  'Creeping Death': '死亡蔓延',
  'Empathic Resolve': '感同身受',
  'Explosive Delivery': '火爆快遞',
  'Tamper Proof': '防止竄改',
  'Tag Team': '標記隊伍',
  Reassigned: '重新補給',
  Overwatch: '掩體掩護',
};

/**
 * 套裝天賦 / Gear-set talents: the four-piece talent, then the chest's and the
 * backpack's. From the owner's in-game screenshots (2026-10-27). Point of no
 * Return is shown in English there, so it stays English.
 */
const GEAR_SET: Record<string, string> = {
  'Spontaneous Combustion': '自燃', Flashpoint: '燃點', 'White Hot': '熾熱高溫',
  'Ortiz Rapid Application Nanite Prototype': '奧提茲迅速施用奈米機器原型', 'Overcharged Nanites': '過載奈米機器', 'Improved Dampeners': '改良阻尼器',
  'Core Exercise': '核心訓練', 'Inner Core': '內核心', 'Outer Core': '外核心',
  Camaraderie: '國土同胞', 'All for One': '人人為我', 'One for All': '我為人人',
  'Throttle Control': '節流控制', Sustainability: '續航力', Snowball: '失控',
  Huddle: '群聚增效', Hivemind: '集體意識', 'Smart Cooperation': '智慧合作',
  'Return to Sender': '悉數奉還', 'Increased Interest': '興趣漸深', 'Over-engineered': '超量修復',
  Symphony: '交響曲', Fortissimo: '極強', Accelerando: '漸快',
  'On Point': '卓越連狙', 'Point of Honor': '連狙榮耀',
  Stoic: '堅忍', Deceit: '欺瞞', 'Polyethylene Plating': '聚乙烯鍍層',
  'Ortiz Incinerator Turret Prototype': '奧提茲焚燒機槍塔原型', 'Chain Combustion': '連鎖燃燒', Heatstroke: '熱中暑',
  Charging: '充能', Overcharging: '超載充能', 'Safe Charging': '安全充能',
  Headache: '迎頭痛擊', 'Stand Tall': '大膽無畏', Lucky: '備受祝福',
  'From the Shadows Into the Light': '由陰影至光明', 'From the Shadows': '由陰影', 'Into the Light': '至光明',
  Heartstopper: '止心者', 'Max BPM': '最大心率', Cold: '寒冷',
  'Tend and Befriend': '互助照護', 'Best Buds': '最佳拍檔', 'Complete Uptime': '完整上線',
  'Apex Predator': '頂尖掠奪者', 'Endless Hunger': '無窮渴望', 'Overwhelming Force': '壓倒性攻勢',
  'Indirect Transmission': '間接傳播', Proliferation: '大幅擴散', 'Symptom Aggravator': '症狀惡化',
  'Ground Control': '地面控制', 'Tactical Superiority': '戰術優勢', 'Advanced Combat Tactics': '戰略戰鬥支援',
  'Makeshift Repairs': '臨場修復', 'Improved Materials': '改良材料', 'Process Refinery': '精煉過程',
  'Hackstep Protocol': '駭步協定', 'Compiler Optimization': '編譯器最佳化', 'Multithreaded Execution': '多線程執行',
  "Striker's Gamble": '突襲者賭注', 'Press the Advantage': '強化優勢', 'Risk Management': '風險管理',
  'Rules of Engagement': '交戰規則', 'Parabellum Rounds': '備戰子彈', 'Trauma Specialist': '創傷專家',
  'Red, White and Blue': '紅、白及藍', 'Waving the Flag': '旗幟飄揚', 'Patriotic Boost': '愛國強化',
  'Feedback Loop': '回饋迴路', 'Positive Reinforcement': '正向增強', 'Short Circuit': '短路',
  "Dead Man's Hand": '亡者手牌', 'No Limit': '沒有極限', 'Ace in the Sleeve': '袖中王牌',
  'Aggressive Recon': '激進偵查', 'Specialized Destruction': '特殊破壞力', 'Signature Moves': '招牌動作',
  'Crowd Control': '敵對談判', 'Target Rich Environment': '目標充足環境', 'Critical Measures': '緊急措施',
};

/**
 * `Perfect X` 是 X 的強化版，共用譯名 / Named and exotic gear carries "Perfect"
 * variants of ordinary talents — the same talent with the source's parenthesised
 * values. The Chinese name is derived rather than listed twice.
 */
export const TALENT_ZH: Record<string, string> = { ...GEAR, ...GEAR_SET, ...WEAPON, ...EXOTIC, ...EXOTIC_GEAR };

/**
 * 天賦內容中譯 / Chinese wording for talent descriptions, keyed by the exact
 * talent name: the built-in lines from `talent-text.ts`, with the sheet laid
 * over them. A `Perfect` variant has its own numbers, so unlike its name it is
 * never derived.
 */
export const TALENT_TEXT_ZH: Record<string, string> = { ...TALENT_TEXT };

export function talentZh(name: string): string | undefined {
  const direct = TALENT_ZH[name];
  if (direct) return direct;
  const base = name.startsWith('Perfect ') ? TALENT_ZH[name.slice(8)] : undefined;
  return base ? `完美${base}` : undefined;
}
