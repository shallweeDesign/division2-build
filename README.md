# 全境封鎖2 配裝工具 / The Division 2 Build Planner

互動式配裝計算器：選裝備、核心、詞條、套裝，即時算出屬性與加成。中英雙語介面。
An interactive build calculator — pick gear, cores, attributes and sets, and see
stats recalculate live. Bilingual zh-TW / en.

## 現況 / Status

**Phase 1（資料管線）與 Phase 2（裝備介面 + 計算引擎）已完成。**
**Phases 1 (data pipeline) and 2 (gear UI + calculation engine) are complete.**

- ✅ 6 個裝備部位、核心／詞條／模組／天賦選擇，套裝加成即時計算
- ✅ 屬性加總、上限判定（爆擊機率 60%、技能階 6）、加成來源追溯
- ⬜ Phase 3 武器與 DPS ／ Phase 4 技能與專精 ／ Phase 5 URL 分享與部署

## 資料來源 / Data source

[div2hub/game-data](https://github.com/div2hub/game-data)，授權 **CC BY 4.0**（僅需標註出處）。
Licensed **CC BY 4.0** — attribution only, so public deployment is fine.

| | 數量 / Count |
|---|---|
| 裝備 / Gear pieces | 499（mask 77、chest 96、backpack 94、gloves 76、holster 79、knees 77） |
| 品牌 / Brands | 38 |
| 套裝 / Gear sets | 28 |
| 屬性 / Attributes | 81（+ 17 裝備模組 / gear mods） |
| 天賦 / Talents | 212 裝備 + 157 武器 |
| 武器 / Weapons | 277 |
| 技能變體 / Skill variants | 43 |
| 增幅 / Augments | 9 |

上游 schema 見 `data/README.md`。該專案禁止空白儲存格，合法缺口一律登記在
`known_gaps.json` 並附到期日——本專案的管線會強制執行這份契約。

The upstream schema lives in `data/README.md`. It forbids empty cells and
registers legitimate holes in `known_gaps.json` with expiry dates; this
project's pipeline enforces that contract.

## 指令 / Commands

```bash
npm install
npm run data     # CSV → src/data/generated/game-data.json（含驗證 / validates）
npm test         # 資料結構不變量 + 計算引擎規則 / invariants + engine rules
npm run dev      # 開發伺服器 / dev server
npm run build    # data + typecheck + vite build
```

`npm run data` **直接失敗**的情況：未登記的空白儲存格、已過期的 known gap、
無法解析的槽位語法、指向不存在屬性／stat／天賦／套裝的參照。
不會靜默略過任何一項。

`npm run data` **fails hard** on unregistered empty cells, expired known gaps,
unparseable slot syntax, and references to attributes, stats, talents or sets
that do not exist. Nothing is silently skipped.

## 設計決定 / Design decisions

- **預設核心 / Default cores** — 裝上一件裝備時，核心會依該品牌／套裝的
  `default_core_stat_id` 預先選好。遊戲裡每件裝備都有核心，預設空白只會讓你
  重複選六次顯而易見的答案。
  Equipping a piece pre-selects the core from its set's `default_core_stat_id`,
  since every piece carries one in game.
- **上限規則寫死 / Caps are hard-coded** — 爆擊機率 60%、技能階 6 屬於遊戲規則
  而非資料，跨版本不變，所以放在 `src/model/calc/constants.ts`。
  Crit chance 60% and skill tier 6 are rules rather than data, so they live in code.
- **兩段式重繪 / Two render scopes** — 換裝備才重建裝備欄，調數值只重算總覽，
  避免輸入中的欄位被重繪奪走焦點。
  Swapping an item rebuilds the gear column; nudging a value only recomputes the
  summary, so re-rendering never steals focus from an input.

## 授權 / License

程式碼 MIT。`data/` 下的資料為 CC BY 4.0，來自 div2hub/game-data，需標註出處。
Code is MIT. Data under `data/` is CC BY 4.0 from div2hub/game-data; attribution required.

《湯姆克蘭西：全境封鎖2》為 Ubisoft Entertainment 的商標，本專案為非官方粉絲工具。
Tom Clancy's The Division 2 is a trademark of Ubisoft Entertainment. Unofficial fan tool.
