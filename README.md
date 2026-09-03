# 全境封鎖2 配裝工具 / The Division 2 Build Planner

互動式配裝計算器：選裝備、核心、詞條、套裝，即時算出屬性與加成。中英雙語介面。
An interactive build calculator — pick gear, cores, attributes and sets, and see
stats recalculate live. Bilingual zh-TW / en.

## 現況 / Status

**Phase 1（資料管線）與 Phase 2（裝備介面 + 計算引擎）已完成。**
**Phases 1 (data pipeline) and 2 (gear UI + calculation engine) are complete.**

- ✅ 6 個裝備部位、核心／詞條／模組／天賦選擇，套裝加成即時計算
- ✅ 屬性加總、上限判定（爆擊機率 60%、技能階 6）、加成來源追溯
- ✅ 10 套推薦配裝，一鍵套用
- ✅ 中英雙語，含裝備名稱中譯
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
npm run deploy   # 建置並同步到 Pages 站台 / build and sync into the Pages site
npm run i18n:seed # 匯出現有譯名成 CSV，用來初始化 Google Sheet
```

## 線上改譯名 / Editing names in a sheet

譯名可以放在 Google Sheet 上直接改，不必動程式碼也不必重新部署。
建置進去的那份仍在，線上那份只是疊在上面。

1. 建一個 Google Sheet，三欄：`kind` / `key` / `zh-tw`
   - `kind` 只接受 `item`、`talent`、`stat` 三種
   - `key` 是資料集裡的英文名（`Robin`、`Braced`、`weapon-damage`）
2. `npm run i18n:seed` 產生 `i18n-seed.csv`，貼進去當起點（目前 279 列）
3. 檔案 → 共用 → 發布到網路 → 選該工作表 → CSV，複製網址
4. 把網址填進 `src/i18n/overrides.ts` 的 `SHEET_URL`，重新部署一次

之後改 Sheet 的儲存格，重整網頁就會看到。

**故意留的三道防線：** 空白儲存格會被忽略而不是把名字清空；
抓不到、逾時或工作表被取消發布時，畫面維持建置進去的那份；
`SHEET_URL` 留空就完全關閉這個機制。

Names can live in a Google Sheet and be edited without a build or a deploy. The
baked-in names still ship; the sheet is laid over them. An empty cell is ignored
rather than applied, and any failure leaves the built-in names showing.

`npm run deploy` 會**先清空**目標資料夾再複製。Vite 的資源檔名帶內容雜湊，
直接覆蓋會把上一版的 bundle 永久留在站上——沒人引用卻仍被送出。
腳本停在同步完成，commit 與 push 的指令會印出來讓你自己執行。
外接碟沒掛載、或建置用錯 `base` 路徑時，腳本會中止並說明原因。

`npm run deploy` wipes the target before copying: Vite's hashed filenames mean
copying over the top strands every previous bundle in the deployed site. It
stops after syncing and prints the commit/push commands rather than running
them. It aborts if the drive is not mounted, or if the build was made for the
wrong base path.

上線位置 / Live at: <https://shallweedesign.github.io/lab/division2_builder/>

`npm run data` **直接失敗**的情況：未登記的空白儲存格、已過期的 known gap、
無法解析的槽位語法、指向不存在屬性／stat／天賦／套裝的參照。
不會靜默略過任何一項。

`npm run data` **fails hard** on unregistered empty cells, expired known gaps,
unparseable slot syntax, and references to attributes, stats, talents or sets
that do not exist. Nothing is silently skipped.

## 推薦配裝 / Recommended builds

`src/data/recommended.ts` 有 10 套起手範本（輸出／坦克／技能／支援各類）。
範本以**套裝名稱**而非裝備 id 描述組成，資料更新後仍能正確解析；
`resolveRecommended()` 負責挑件、配核心與詞條。測試會驗證每一套都能組滿 6 件
並觸發 4 件套天賦。

`src/data/recommended.ts` holds ten starting-point templates across DPS, tank,
skill and support. They reference **set names** rather than item ids so they keep
resolving across data updates; `resolveRecommended()` picks the pieces and fills
cores and minors. Tests assert every template fills all six slots and activates
its four-piece talent.

**這些是起手範本，不是最佳解。** 實際強度依版本與玩法而異，套用後請自行調整。
**They are starting points, not optimal builds** — tune them to your gear and playstyle.

## 中文化 / Chinese localisation

| | 狀態 / Status |
|---|---|
| 屬性 / Stats | 61/61 ✅ |
| 品牌 / Brands | 38/38 ✅ |
| 套裝 / Gear sets | 27/28（缺 Ember Engine） |
| 一般裝備 / Generic pieces | 396/396 ✅（由品牌／套裝 + 部位組合而成） |
| 具名與奇特 / Named & exotic | 0/103 ⬜ 回退英文 |
| 天賦 / Talents | 0/369 ⬜ 回退英文 |

品牌與套裝譯名是以**加成數值完全吻合**對照社群中文資料庫確認的，不是音譯猜測。
具名／奇特裝備與天賦名稱目前沒有可靠來源，因此保留英文——顯示英文比放一個
看起來像官方譯名的錯誤名稱好。要補充請在 `src/i18n/names.ts` 的 `ITEM_ZH` 加行。

Brand and set names were confirmed by matching exact bonus values against a
community Chinese database, not guessed from transliteration. Named/exotic items
and talents have no reliable source, so they stay English: a visibly English name
beats a plausible-looking wrong one. Add entries to `ITEM_ZH` in
`src/i18n/names.ts` to fill the gaps.

## 設計決定 / Design decisions

- **預設核心 / Default cores** — 裝上一件裝備時，核心會依該品牌／套裝的
  `default_core_stat_id` 預先選好。遊戲裡每件裝備都有核心，預設空白只會讓你
  重複選六次顯而易見的答案。
  Equipping a piece pre-selects the core from its set's `default_core_stat_id`,
  since every piece carries one in game.
- **上限規則寫死 / Caps are hard-coded** — 爆擊機率 60%、技能階 6 屬於遊戲規則
  而非資料，跨版本不變，所以放在 `src/model/calc/constants.ts`。
  Crit chance 60% and skill tier 6 are rules rather than data, so they live in code.
- **不編造譯名 / No invented translations** — 未確認的名稱一律回退英文，並由測試
  持續回報覆蓋率，缺口是可見的而非被掩蓋。
  Unconfirmed names fall back to English and a test reports coverage, so gaps stay visible.
- **兩段式重繪 / Two render scopes** — 換裝備才重建裝備欄，調數值只重算總覽，
  避免輸入中的欄位被重繪奪走焦點。
  Swapping an item rebuilds the gear column; nudging a value only recomputes the
  summary, so re-rendering never steals focus from an input.

## 授權 / License

程式碼 MIT。`data/` 下的資料為 CC BY 4.0，來自 div2hub/game-data，需標註出處。
Code is MIT. Data under `data/` is CC BY 4.0 from div2hub/game-data; attribution required.

《湯姆克蘭西：全境封鎖2》為 Ubisoft Entertainment 的商標，本專案為非官方粉絲工具。
Tom Clancy's The Division 2 is a trademark of Ubisoft Entertainment. Unofficial fan tool.
