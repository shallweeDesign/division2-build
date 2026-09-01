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

/** 一般天賦 / Base talents, each confirmed against its values in `data/`. */
export const TALENT_ZH: Record<string, string> = {
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
export function talentZh(name: string): string | undefined {
  const direct = TALENT_ZH[name];
  if (direct) return direct;
  const base = name.startsWith('Perfect ') ? TALENT_ZH[name.slice(8)] : undefined;
  return base ? `完美${base}` : undefined;
}
