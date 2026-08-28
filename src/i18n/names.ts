/**
 * 裝備名稱中譯 / Traditional Chinese names for brands, gear sets and items.
 *
 * 品牌與套裝的譯名是以「加成數值完全吻合」對照社群中文資料庫確認的，不是音譯猜測。
 * 具名與奇特裝備目前沒有可靠來源，`ITEM_ZH` 只收已確認的條目，其餘回退英文——
 * 寧可顯示英文，也不要放一個看起來像官方譯名的錯誤名稱。
 *
 * Brand and gear-set names were confirmed by matching exact bonus values against
 * a community Chinese database, not guessed from transliteration. Named and
 * exotic items have no reliable source yet, so `ITEM_ZH` holds only confirmed
 * entries and everything else falls back to English: a visibly English name is
 * better than a plausible-looking wrong one.
 *
 * 要補充譯名，直接在 `ITEM_ZH` 加一行即可（鍵為資料集裡的英文名稱）。
 * To add a translation, append a line to `ITEM_ZH` keyed by the dataset's English name.
 */

/** 部位 / Gear slots, used to compose generic "{Set} {Slot}" names. */
export const SLOT_ZH: Record<string, string> = {
  mask: '面罩',
  chest: '胸甲',
  backpack: '背包',
  gloves: '手套',
  holster: '槍套',
  knees: '護膝',
};

/** 品牌 / Brands. All 38 confirmed against bonus values. */
export const BRAND_ZH: Record<string, string> = {
  '5.11 Tactical': '5.11 Tactical',
  'Airaldi Holdings': '阿爾拉蒂企業',
  'Alps Summit Armaments': '阿爾卑斯山峰軍事',
  'Badger Tuff': '貝哲陶夫',
  'Belstone Armory': '貝爾斯通軍火',
  'Brazos de Arcabuz': '鉤銃軍備',
  'Ceska Vyroba s.r.o.': '捷克出產自律組織',
  'China Light Industries': '中國光能工業公司',
  'Douglas & Harding': '道格拉斯與哈定企業',
  'Edelweiss GPz': '雪絨花',
  Electrique: '電氣',
  'Empress International': '女皇國際',
  'Fenris Group AB': '芬里斯集團公司',
  'Gila Guard': '毒蜥守衛隊',
  'Golan Gear Ltd': '戈蘭裝備有限公司',
  'Grupo Sombra S.A.': '影子軍團股份有限公司',
  'Habsburg Guard': '哈布斯堡護具',
  'Hana-U Corporation': '哈瑙公司',
  'Imminence Armaments': '危急武裝',
  // Not a real brand — the pseudo-set crafted gear belongs to.
  Improvised: '自製',
  'Legatus S.p.A': '軍團公眾有限公司',
  Lengmo: '冷漠',
  'Murakami Industries': '村上工業',
  'Overlord Armaments': '霸主軍備公司',
  'Palisade Steelworks': '戍衛煉鋼',
  'Petrov Defense Group': '彼得羅夫防禦集團',
  'Providence Defense': '天命防禦公司',
  'Richter & Kaiser GmbH': '李希特與凱薩有限公司',
  'Royal Works': '皇室工藝',
  'Shiny Monkey': '閃耀猴子裝備',
  'Sokolov Concern': '索寇羅夫企業',
  'Unit Alloys': '特種合金',
  'Urban Lookout': '城鎮瞭望',
  'Uzina Getica': '烏茲娜．蓋蒂卡',
  'Walker, Harris & Co.': '沃克與哈里斯企業',
  'Wyvern Wear': '飛龍紡織',
  'Yaahl Gear': '耶爾裝甲',
  'Zwiadowka Sp. z o.o.': '茲維多弗卡有限公司',
};

/** 套裝 / Gear sets. 27 of 28 confirmed; Ember Engine has no source yet. */
export const GEAR_SET_ZH: Record<string, string> = {
  'Aces & Eights': 'A & 8',
  Aegis: '庇護',
  'Breaking Point': '臨界點',
  Cavalier: '騎士',
  'Concentrated Company': '鎖定專精',
  'Core Strength': '核心力量',
  'Eclipse Protocol': '日蝕協定',
  'Foundry Bulwark': '鑄造廠堡壘',
  'Future Initiative': '未來主動權',
  'Hard Wired': '固線連結',
  Heartbreaker: '心碎者',
  Hotshot: '頂尖專家',
  "Hunter's Fury": '獵人怒火',
  'Measured Assembly': '精密組裝',
  "Negotiator's Dilemma": '談判者困境',
  'Ongoing Directive': '政令進行式',
  'Ortiz: Exuro': '奧提茲：火噬',
  'Ortiz: Reficere': '奧提茲：修復',
  Refactor: '重新構造',
  Rigger: '裝配工',
  "Striker's Battlegear": '突襲者戰鬥裝備',
  'System Corruption': '系統毀損',
  'Tip of the Spear': '先鋒部隊',
  'Tipping Scales': '打破平衡',
  'True Patriot': '真實愛國者',
  'Umbra Initiative': '本影倡議',
  Virtuoso: '大師',
};

/**
 * 具名與奇特裝備 / Named and exotic items, keyed by their English name.
 * Deliberately sparse — see the file header.
 */
export const ITEM_ZH: Record<string, string> = {};

export const SET_ZH = { ...BRAND_ZH, ...GEAR_SET_ZH };
