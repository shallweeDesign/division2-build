/**
 * 技能名中譯 / Traditional Chinese names for skills and their variants.
 *
 * 目前刻意留空：沒有可對照的來源確認官方譯名，照本專案的規則，寧可顯示英文，
 * 也不要放一個看起來像官方譯名的錯誤名稱。譯名在 Google Sheet 以 `skill` 種類補上即可，
 * 鍵為資料集的英文名稱（變體全名，例如 `Assault Turret`；或母技能名，例如 `Turret`）。
 *
 * Deliberately empty: there is no source to confirm the official names against,
 * and a visibly English name beats a plausible wrong one. Fill them in from the
 * Google Sheet under kind `skill`, keyed by the dataset's English name — either
 * the full variant (`Assault Turret`) or the parent skill (`Turret`).
 */
export const SKILL_ZH: Record<string, string> = {};
