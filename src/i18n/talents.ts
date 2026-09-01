/**
 * 天賦名稱中譯 / Traditional Chinese talent names.
 *
 * Sourced from two community sheets (see below), which give a Chinese name and
 * an effect for each talent but no English name — so every entry here was
 * matched by hand and only kept when the talent's identity was unmistakable.
 *
 * ⚠ Only the **names** are taken. Both sheets' numbers are from an older game
 * version and disagree with the current data set and with each other (Berserk
 * reads "every 20% armor lost" in one and "every 10%" in the other; Close &
 * Personal is +50%/5s against the current +30%/10s). They also still list
 * talents the game has since removed. Descriptions therefore keep coming from
 * `data/`, which tracks the live game — a wrong number in a calculator is
 * worse than an English sentence.
 *
 * Because the sheets lag the game, a mechanic that no longer matches does not
 * mean the talent is a different one. Entries below are split by how they were
 * confirmed, so a future reader can re-check the weaker half.
 *
 * Sources, both Traditional Chinese community translations:
 *   - docs.google.com/spreadsheets/d/16pZt0X6jTcZiss1SDP807H-QbbTgKsVYwKfj7udsuGQ
 *     (credits ゼロ s155350, 老楊 saps87116)
 *   - 全境封鎖 2 中文百科, 能能糯米 編著/翻譯 — youtube.com/能能糯米RunRunRomeo
 */

/** 機制與名稱都吻合 / Chinese effect still describes the talent in `data/`. */
const CONFIRMED_BY_MECHANIC: Record<string, string> = {
  'Unstoppable Force': '無人能擋的力量',
  Spotter: '探子',
  Unbreakable: '牢不可破',
  Entrench: '鞏固',
  Efficient: '效率第一',
  'Mad Bomber': '瘋狂炸彈客',
  Braced: '鼓起勇氣',
  Calculated: '精打細算',
  Skilled: '熟練',
  'Tech Support': '技術支援',
  Trauma: '創傷',
  'Creeping Death': '死亡蔓延',
};

/**
 * 名稱直譯、天賦身分明確，但機制已改版 / The Chinese name is a direct reading of
 * the English one and the talent is clearly the same, but the game has since
 * reworked what it does, so the sheet's wording no longer lines up.
 */
const CONFIRMED_BY_NAME: Record<string, string> = {
  Obliterate: '抹滅性破壞',
  Opportunistic: '投機取巧',
  Wicked: '惡人',
  Gunslinger: '槍神',
  Bloodsucker: '吸血生物',
  Safeguard: '安全護衛',
};

export const TALENT_ZH: Record<string, string> = {
  ...CONFIRMED_BY_MECHANIC,
  ...CONFIRMED_BY_NAME,
};

/**
 * `Perfect X` 是 X 的強化版，共用譯名 / Named/exotic gear carries "Perfect"
 * variants of ordinary talents. They are the same talent turned up, so the
 * Chinese name is derived rather than listed twice.
 */
export function talentZh(name: string): string | undefined {
  const direct = TALENT_ZH[name];
  if (direct) return direct;
  const base = name.startsWith('Perfect ') ? TALENT_ZH[name.slice(8)] : undefined;
  return base ? `完美${base}` : undefined;
}
