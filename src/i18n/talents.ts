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
  'Gangland Hit': '結黨追隨',
  'Geri and Freki': '基立和庫力奇',
  'High Priority Target': '高優先',
  'In Plain Sight': '一目了然',
  'Incessant Chatter': '喋喋不休',
  'Mosquito Song': '蚊曲',
  'Ortiz Assault Interface': '奧提茲',
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
 * `Perfect X` 是 X 的強化版，共用譯名 / Named and exotic gear carries "Perfect"
 * variants of ordinary talents — the same talent with the source's parenthesised
 * values. The Chinese name is derived rather than listed twice.
 */
export const TALENT_ZH: Record<string, string> = { ...GEAR, ...WEAPON, ...EXOTIC };

export function talentZh(name: string): string | undefined {
  const direct = TALENT_ZH[name];
  if (direct) return direct;
  const base = name.startsWith('Perfect ') ? TALENT_ZH[name.slice(8)] : undefined;
  return base ? `完美${base}` : undefined;
}
