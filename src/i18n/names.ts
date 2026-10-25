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

/**
 * 套裝 / Gear sets, all 28. Ember Engine's name is from the user's in-game
 * screenshot (2026-10-11), the others as before.
 */
export const GEAR_SET_ZH: Record<string, string> = {
  'Aces & Eights': 'A & 8',
  Aegis: '庇護',
  'Breaking Point': '臨界點',
  Cavalier: '騎士',
  'Concentrated Company': '鎖定專精',
  'Core Strength': '核心力量',
  'Eclipse Protocol': '日蝕協定',
  'Ember Engine': '餘燼引擎',
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
  Refactor: '重新構建',
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
/**
 * 奇特武器 / Exotic weapon names, derived the way the named gear was.
 *
 * Each exotic is locked to one talent and no other weapon carries it, so
 * pairing the data set's weapon-to-talent link with the source's talent column
 * names the weapon without reading its name. Bluescreen fell out that way: its
 * Disruptor Rounds marks an enemy up to 50 stacks, and exactly one row in the
 * source describes that.
 */
const EXOTIC_WEAPON_ZH: Record<string, string> = {
  'Agitator': '鼓動者',
  'Backfire': '逆火',
  'Big Alejandro': '大亞歷杭德羅',
  'Bittersweet': '苦甜',
  'Bluescreen': '藍螢幕',
  'Bullet King': '槍彈王者',
  'Busy Little Bee': '辛勤小蜜蜂',
  'Caduceus': '雙蛇杖',
  'Capacitor': '電容突擊',
  'Chameleon': '變色龍',
  'Diamondback': '響尾蛇',
  'Doctor Home': '醫生之家',
  'Dread Edict': '恐懼法令',
  'Eagle Bearer': '帶鷹人',
  'Fafnir': '法夫納',
  'Iron Lung': '鐵龍',
  'Lady Death': '死亡女神',
  'Liberty': '自由',
  'Mantis': '螳螂',
  'Merciless': '無情',
  'Mosquito': '蚊子',
  'Nemesis': '復仇女神',
  'Ouroboros': '銜尾蛇',
  'Overlord': '霸主',
  'Oxpecker': '牛椋鳥',
  'Pakhan': '帕坎',
  'Pestilence': '鼠疫',
  'Prima Donna': '核心人物',
  'Regulus': '王子左輪手槍',
  'Sacrum Imperium': '神聖帝國',
  'Scorpio': '天蠍座',
  'Sheriff': '警長',
  'Shroud': '帷幕',
  "St. Elmo's Engine": '聖艾爾摩引擎',
  'Steel & Sons ACR': '斯蒂爾子嗣 ACR',
  'Strega': '女巫',
  'Sweet Dreams': '美夢',
  'Tempest': '子彈風暴',
  'The Bighorn': '大角突擊步槍',
  'The Chatterbox': '話匣子',
  'The Ravenous': '饑餓之人',
  'Underboss': '二當家',
  'Vindicator': '復仇者',
  'Whiplash': '鞭子',
};

export const ITEM_ZH: Record<string, string> = {
  // 由「完美天賦」反查 / Derived from the Perfect talent each piece is locked to.
  // A named piece carries exactly one Perfect talent and each Perfect talent
  // belongs to exactly one piece, so pairing the data set's item→talent link
  // with the source's talent→item column names the piece without reading the
  // name itself. The comment on each line is the talent that identified it.
  "Anarchist's Cookbook": '無政府主義者食譜',  // Perfect Wicked
  'Axel': '阿克塞爾',  // Perfect Energize
  'Backbone': '骨幹',  // Perfect Unstoppable Force
  'Battery Pack': '電池包',  // Perfect Calculated
  'Benefactor': '贊助人',  // Perfect Empathic Resolve
  'Bober': '飽勃',  // Perfect Entrench; spelled as the game list has it
  'Bulldog': '鬥牛犬',  // Perfect Composure
  "Caesar's Guard": '凱撒護胸',  // Perfect Skilled
  "Cap'n": '隊長',  // Perfect Leadership
  'Carpenter': '破壞巧匠',  // Perfect Mad Bomber
  'Chainkiller': '連環殺手',  // Perfect Headhunter
  'Cherished': '蒙主恩寵',  // Perfect Trauma
  'Closer': '縮距護胸',  // Perfect Spotter
  'Combustor': '燃燒室',  // Perfect Explosive Delivery
  "Devil's Due": '魔鬼回報',  // Perfect Clutch
  "Door-Kicker's Knock": '破門提醒',  // Perfect Spark
  'Equalizer': '平等之人',  // Perfect Obliterate
  'Everyday Carrier': '日常背心',  // Perfect Efficient
  'Ferocious Calm': '兇猛平靜',  // Perfect Overwatch
  'Force Multiplier': '戰力倍增',  // Perfect Combined Arms
  'Henri': '亨利',  // Perfect Companion
  'Hermano': '兄弟',  // Perfect Overclock
  'Hunter-Killer': '獵人殺手',  // Perfect Intimidate
  'Impetus': '無限衝勁',  // Perfect Kinetic Momentum
  'Keeper': '看守者',  // Perfect Protector
  'Lavoisier': '拉瓦節',  // Perfect Galvanize
  'Liquid Engineer': '液態工程師',  // Perfect Bloodsucker
  'Matador': '鬥牛士',  // Perfect Adrenaline Rush
  'Melon Baller': '點頭高手',  // Perfect Concussion
  'Momma Badger': '母獾',  // Perfect Safeguard
  'Percussive Maintenance': '敲打維護',  // Perfect Tech Support
  'Pointman': '尖兵',  // Perfect Vanguard
  'Pristine Example': '精粹典範',  // Perfect Focus
  'Proxy': '代理',  // Perfect Tamper Proof
  'Robin': '知更鳥',  // Perfect Gunslinger
  'Rushdown': '強攻',  // Perfect Tag Team
  'Sleight': '靈巧身手',  // Perfect Protected Reload
  'Strategic Alignment': '戰略一致',  // Perfect Shock and Awe
  'The Courier': '聖使',  // Perfect Creeping Death
  'The Gift': '禮物',  // Perfect Vigilance
  'The Sacrifice': '犧牲奉獻',  // Perfect Glass Cannon
  'The Setup': '收納裝配',  // Perfect Opportunistic
  'Trick Shot': '亂槍打鳥',  // Perfect Reassigned
  'Vedmedytsya Vest': '亞列姆切背心',  // Perfect Braced
  'Vigil': '守夜',  // Perfect Versatile
  "Zero F's": '「零」為不亂',  // Perfect Unbreakable

  // 遊戲內名稱表 / From in-game name lists the user supplied (2026-10-25),
  // grouped by brand and slot. Each brand has at most two named pieces per
  // slot, so brand + slot identifies the piece; where there are two, the
  // Chinese meaning settles which (守夜者 Nightwatcher, 冷靜 Chill Out).
  'Punch Drunk': '昏頭脹腦',
  'Nightwatcher': '守夜者',
  'Chill Out': '冷靜',
  'Visionario': '遠見不凡',
  'The Hollow Man': '空心人',
  'Festive Delivery': '節慶快遞',
  'Deathgrips': '死亡之握',
  "Contractor's Gloves": '承包商手套',
  'Motherly Love': '母性之愛',
  'Eagles Grasp': '雄鷹爪擊',
  'Firm Handshake': '緊實握手',
  'Forge': '鍛鍊',
  'Ammo Dump': '彈藥堆',
  'Picaros Holster': '流氓槍套',
  'Spot-On': '精準',
  'Salvo': '齊射',
  'Claws Out': '張牙舞爪',
  "Fox's Prayer": '散兵坑禱詞',
  'Turmoil': '騷亂',
  "Emperor's Guard": '御前護衛',
  'Grease': '潤滑油',
  'Cloak': '斗篷',
  'Snow Machine': '製雪機',  // named by the user; not in the lists

  // 奇特裝備 / Exotic gear, matched by slot and meaning; Blacklisters by
  // elimination, the only knee pad left.
  'Vile': '卑鄙之人',
  'Catharsis': '情感宣洩',
  "Coyote's Mask": '「土狼」的面具',
  'Catalyst': '催化',
  'Tinkerer': '維修工匠',
  'Investor': '投資人',
  'Collector': '收集者',
  'Provocator': '挑釁者',
  'Beacon': '烽火',
  'Tardigrade Armor System': '「緩步動物」裝甲系統',
  "Ridgeway's Pride": '瑞吉威的驕傲',
  'Iron Will': '鋼鐵意志',
  "Acosta's Go-Bag": '阿科斯塔應急包',
  "Birdie's Quick Fix Pack": '博蒂的快速修復組合包',
  'Memento': '追悼',
  'NinjaBike Messenger Backpack': '忍者機車信差背包',
  'Harrier Pride': '獵鷹加油',  // confirmed by the user; the list also has 沙羅
  'Bloody Knuckles': '血腥指套',
  'BTSU Datagloves': 'BTSU 資料手套',
  'Exodus Gloves': '遷徙手套',
  'Overdogs': '優勢打擊',
  'Rugged Gauntlets': '紮實手套',
  'Centurion Scabbard': '百夫長劍鞘',
  "Dodge City Gunslinger's Holster": '道奇城槍手槍套',
  'Imperial Dynasty': '皇朝',
  'Shocker Punch': '雷電出擊',
  'Waveform': '波形',
  'Nimble Holster': '敏捷槍套',
  "Sawyer's Kneepads": '索耶的護膝',
  'Acosta Kneepads': '阿科斯塔的護膝',
  'Blacklisters': '針鋒相對',
  'NinjaBike Messenger Kneepads': '忍者機車信差護膝',
  "Nurse's Kneepads": '護理師護膝',

  // 套裝部件 / Gear-set pieces. The data set names them "{Set} {Slot}", but in
  // game each has its own name (Tipping Scales Mask is 永續面具), so these
  // replace the composed fallback.
  // Mask
  'Hard Wired Mask': '「羅德斯伍德」AR 面具',
  'Ongoing Directive Mask': '採集者面具',
  'True Patriot Mask': '赫夫特等級 A 面具',
  "Negotiator's Dilemma Mask": '吹捧面具',
  'Aces & Eights Mask': '柳德米拉狙擊手面具',
  'Tip of the Spear Mask': '雷面具',
  'System Corruption Mask': '攻擊向量面具',
  "Striker's Battlegear Mask": '突襲者的面具',
  'Eclipse Protocol Mask': '生物危害面具',
  'Future Initiative Mask': '戰爭迷霧面具',
  'Foundry Bulwark Mask': '高溫面具',
  "Hunter's Fury Mask": '獵人面具',
  'Rigger Mask': '裝配工防塵口罩',
  'Heartbreaker Mask': '隱匿氣息面具',
  'Umbra Initiative Mask': '本影倡議面具',
  'Hotshot Mask': '頂尖專家面具',
  'Cavalier Mask': '騎士面具',
  'Ortiz: Exuro Mask': '火噬面具',
  'Aegis Mask': '庇護面具',
  'Breaking Point Mask': '開拓者面具',
  'Virtuoso Mask': '延音面具',
  'Refactor Mask': '重生面具',
  'Measured Assembly Mask': '最終面具',
  'Tipping Scales Mask': '永續面具',
  'Concentrated Company Mask': '專注面具',
  'Core Strength Mask': '訓練面具',
  'Ember Engine Mask': '空氣呼吸器面具',
  'Ortiz: Reficere Mask': '電弧面具',
  // Chest
  'Hard Wired Chest': '「蛇形」陣列背心',
  'Ongoing Directive Chest': '資源背帶',
  'True Patriot Chest': '阿普爾頓防彈衣',
  "Negotiator's Dilemma Chest": '高估裝甲',
  'Aces & Eights Chest': '譚妮雅寂靜背心',
  'Tip of the Spear Chest': '萊特戰鬥背心',
  'System Corruption Chest': '複合威脅裝甲',
  "Striker's Battlegear Chest": '突襲者的甲冑',
  'Eclipse Protocol Chest': '封閉胸甲',
  'Future Initiative Chest': '水龜武裝胸甲',
  'Foundry Bulwark Chest': '鍛造裝甲',
  "Hunter's Fury Chest": '獵人牢籠',
  'Rigger Chest': '裝配工快速穿戴吊帶',
  'Heartbreaker Chest': '堅定不移背心',
  'Umbra Initiative Chest': '本影倡議背心',
  'Hotshot Chest': '頂尖專家背心',
  'Cavalier Chest': '騎士背心',
  'Ortiz: Exuro Chest': '火噬胸甲',
  'Aegis Chest': '庇護胸甲',
  'Breaking Point Chest': '前線裝甲',
  'Virtuoso Chest': '勇壯護胸',
  'Refactor Chest': '重改背心',
  'Measured Assembly Chest': '最終裝甲',
  'Tipping Scales Chest': '抗爆戰術背心',
  'Concentrated Company Chest': '緊扣戰術背心',
  'Core Strength Chest': '增重背心',
  'Ember Engine Chest': '抗爆護板',
  'Ortiz: Reficere Chest': '科技護板',
  // Backpack
  'Hard Wired Backpack': '「阿伯頓」精力背包',
  'Ongoing Directive Backpack': '戰地外架式背包',
  'True Patriot Backpack': '德瑞微遠足背包',
  "Negotiator's Dilemma Backpack": '小利背包',
  'Aces & Eights Backpack': '莉巴低調背包',
  'Tip of the Spear Backpack': '布萊德戰術背包',
  'System Corruption Backpack': '堆疊溢位容器',
  "Striker's Battlegear Backpack": '突襲者的背包',
  'Eclipse Protocol Backpack': '防撞旅行包',
  'Future Initiative Backpack': '2k-RTS 無線電載波',
  'Foundry Bulwark Backpack': '護盾背包',
  "Hunter's Fury Backpack": '獵人背囊',
  'Rigger Backpack': '裝配工工具包',
  'Heartbreaker Backpack': '無拘無束背包',
  'Umbra Initiative Backpack': '本影倡議背包',
  'Hotshot Backpack': '頂尖專家背包',
  'Cavalier Backpack': '騎士背包',
  'Ortiz: Exuro Backpack': '火噬背包',
  'Aegis Backpack': '庇護背包',
  'Breaking Point Backpack': '指針背包',
  'Virtuoso Backpack': '集成曲背包',
  'Refactor Backpack': '重組背包',
  'Measured Assembly Backpack': '精密背包',
  'Tipping Scales Backpack': '耐久背包',
  'Concentrated Company Backpack': '導向背包',
  'Core Strength Backpack': '健身背包',
  'Ember Engine Backpack': '儲罐器',
  'Ortiz: Reficere Backpack': '奈米背包',
  // Gloves
  'Hard Wired Gloves': '「莫爾西」靜電放電手套',
  'Ongoing Directive Gloves': '近身戰鬥護拳',
  'True Patriot Gloves': '羅斯護手',
  "Negotiator's Dilemma Gloves": '迎合手套',
  'Aces & Eights Gloves': '羅莎穩定手套',
  'Tip of the Spear Gloves': '雷耶斯戰鬥手套',
  'System Corruption Gloves': '觸覺繞行手套',
  "Striker's Battlegear Gloves": '突襲者的手套',
  'Eclipse Protocol Gloves': '醫療級戰術手套',
  'Future Initiative Gloves': 'APM 控制手套',
  'Foundry Bulwark Gloves': '坩堝手套',
  "Hunter's Fury Gloves": '獵人之爪',
  'Rigger Gloves': '裝配工防滑手套',
  'Heartbreaker Gloves': '輕度碰觸手套',
  'Umbra Initiative Gloves': '本影倡議手套',
  'Hotshot Gloves': '頂尖專家手套',
  'Cavalier Gloves': '騎士手套',
  'Ortiz: Exuro Gloves': '火噬戰術手套',
  'Aegis Gloves': '庇護手套',
  'Breaking Point Gloves': '刀尖手套',
  'Virtuoso Gloves': '升半音手套',
  'Refactor Gloves': '重刷手套',
  'Measured Assembly Gloves': '精密手套',
  'Tipping Scales Gloves': '牢固手套',
  'Concentrated Company Gloves': '指向手套',
  'Core Strength Gloves': '殘影拳擊手套',
  'Ember Engine Gloves': '防火手套',
  'Ortiz: Reficere Gloves': '熱作手套',
  // Holster
  'Hard Wired Holster': '「阿爾斯沃特」代理掛包',
  'Ongoing Directive Holster': '特殊彈藥槍套',
  'True Patriot Holster': '楊低磨擦力槍套',
  "Negotiator's Dilemma Holster": '柏忌腿掛包',
  'Aces & Eights Holster': '克拉維迪亞隨身武器托套',
  'Tip of the Spear Holster': '利里槍套系統',
  'System Corruption Holster': '框架注入槍套',
  "Striker's Battlegear Holster": '突襲者的槍套',
  'Eclipse Protocol Holster': '防護改良腿掛包',
  'Future Initiative Holster': '猛擊戰術槍套',
  'Foundry Bulwark Holster': '鐵砧工具腰帶',
  "Hunter's Fury Holster": '獵人箭袋',
  'Rigger Holster': '裝配工多功能腰包',
  'Heartbreaker Holster': '蓄勢待發槍套',
  'Umbra Initiative Holster': '本影倡議槍套',
  'Hotshot Holster': '頂尖專家槍套',
  'Cavalier Holster': '騎士槍套',
  'Ortiz: Exuro Holster': '火噬槍套',
  'Aegis Holster': '庇護槍套',
  'Breaking Point Holster': '死眼槍套',
  'Virtuoso Holster': '緩板槍套',
  'Refactor Holster': '重修槍套',
  'Measured Assembly Holster': '最終槍套',
  'Tipping Scales Holster': '醫療槍套',
  'Concentrated Company Holster': '鎖定槍套',
  'Core Strength Holster': '馬拉松槍套',
  'Ember Engine Holster': '灼熱槍套',
  'Ortiz: Reficere Holster': '熱塑槍套',
  // Kneepads
  'Hard Wired Kneepads': '「史特恩」固定護膝',
  'Ongoing Directive Kneepads': '膝罩',
  'True Patriot Kneepads': '謝李登護膝',
  "Negotiator's Dilemma Kneepads": '低估護膝',
  'Aces & Eights Kneepads': '妮娜俯臥膝墊',
  'Tip of the Spear Kneepads': '崔布利護膝',
  'System Corruption Kneepads': '零日護膝',
  "Striker's Battlegear Kneepads": '突襲者的護膝',
  'Eclipse Protocol Kneepads': '防撕裂護膝',
  'Future Initiative Kneepads': '躍動護膝',
  'Foundry Bulwark Kneepads': '鐵鎚護膝',
  "Hunter's Fury Kneepads": '獵人護膝',
  'Rigger Kneepads': '裝配工防撞護膝',
  'Heartbreaker Kneepads': '侵略挑釁護膝',
  'Umbra Initiative Kneepads': '本影倡議護膝',
  'Hotshot Kneepads': '頂尖專家護膝',
  'Cavalier Kneepads': '騎士護膝',
  'Ortiz: Exuro Kneepads': '火噬護膝',
  'Aegis Kneepads': '庇護護膝',
  'Breaking Point Kneepads': '戰馬護膝',
  'Virtuoso Kneepads': '跳弓護膝',
  'Refactor Kneepads': '重塑護膝',
  'Measured Assembly Kneepads': '精密護膝',
  'Tipping Scales Kneepads': '動力護膝',
  'Concentrated Company Kneepads': '追蹤護膝',
  'Core Strength Kneepads': '練腿日護膝',
  'Ember Engine Kneepads': '防火護膝',
  'Ortiz: Reficere Kneepads': '工坊護膝',
};

Object.assign(ITEM_ZH, EXOTIC_WEAPON_ZH);

export const SET_ZH = { ...BRAND_ZH, ...GEAR_SET_ZH };
