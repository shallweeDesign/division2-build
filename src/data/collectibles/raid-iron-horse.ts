/**
 * 鐵馬行動 / Operation Iron Horse, the second 8-player raid (2020): five keys
 * for the end chest and five backpack trophies.
 *
 * Follows Screen Rant's two guides by Richard Beauchamp — keys (2020-07-15)
 * and trophies (2020-07-07); each is a single section, so items link to that
 * section. Several keys and the Molten trophy are timed, team-split events.
 *
 * Sources predate later title updates; the Chinese wording is our own, and
 * the zh names are ours too (no official zh-TW names were checked).
 */
import type { Collection, CollectItem } from './types.ts';

const KEYS = 'https://screenrant.com/division-2-collect-keys-operation-iron-horse/#all-iron-horse-key-locations-in-division-2';
const TROPHIES = 'https://screenrant.com/division-2-find-all-backpack-trophies-operation-iron-horse/#all-iron-horse-backpack-trophy-locations-in-division-2';

export const IRON_HORSE: Collection = {
  id: 'raid-iron-horse',
  tab: { zh: '掠奪戰・鐵馬', en: 'Raid · Iron Horse' },
  title: { zh: '鐵馬行動：5 把鑰匙與 5 個背包飾品', en: 'Operation Iron Horse: five keys and five backpack trophies' },
  intro: {
    zh: '新的八人掠奪戰。湊齊 5 把鑰匙打開終點寶箱（有機會開出 Ravenous），另有 5 個背包飾品。很多是限時、要分兩隊的機關，進下一區前先看完。依路線順序排列。',
    en: 'The newer 8-player raid. Five keys open the end chest (a chance at Ravenous), plus five backpack trophies. Many are timed, two-team events — read ahead before each area. Listed in route order.',
  },
  type: { zh: '掠奪戰（新）', en: 'Raid (newer)' },
  reward: { zh: '終點寶箱：Ravenous 機率約 10%・5 個背包飾品', en: 'End chest: ~10% Ravenous · five backpack trophies' },
  guides: [
    { name: 'Screen Rant（鑰匙 / keys）', url: KEYS },
    { name: 'Screen Rant（飾品 / trophies）', url: TROPHIES },
  ],
  source: {
    zh: '位置依據 Screen Rant 的兩篇攻略（2020 年 7 月），之後的改版可能有變動；說明文字為本站改寫。',
    en: 'Locations follow two Screen Rant guides (July 2020); later updates may have changed things. The wording here is our own.',
  },
  rules: [
    '路線：Gray 中尉 → Fieser 上尉 → Williams 少校 → Morozova 上校。',
    '終點寶箱要 5 把鑰匙：4 把靠機關，第 5 把是 Morozova 必掉。',
    '這張圖的機關很容易錯過：開門、往下一區走都可能讓該區的鑰匙這一趟拿不到，進新區域前先看說明。',
    '很多機關有時間限制，要先分好兩隊、講好誰負責哪邊。',
    '第 4 把鑰匙那段走廊陷阱很多，帶高危害防護的配裝比較穩。',
  ],
  stages: [
    {
      zh: 'Gray 中尉之後', en: 'After Lieutenant Gray',
      items: [
        { n: 1, kind: 'key', en: 'Key 1: the fuse and the container', zh: '鑰匙：保險絲與藍色貨櫃',
          where: '打倒 Gray 後用保險絲接發電機讓火車開走，來到下一區關著的門前——先別開門。打開四個配電箱，其中一個有保險絲；把保險絲插進發電機，窗戶上方的柵欄會打開，此時馬上往裡面丟震撼彈，炸進裝著鑰匙的藍色貨櫃，再從另一側拿鑰匙。',
          tip: '插保險絲前先讓拿震撼彈的人站好位。' },
        { n: 2, kind: 'trophy', en: 'Breakthrough', zh: '突破（Breakthrough）',
          where: '打倒 Gray 後經過火車一路直走，右邊是藍色貨櫃、左邊是熔岩容器，爬上貨櫃，飾品在裡面。' },
      ],
    },
    {
      zh: 'Fieser 上尉之後', en: 'After Captain Fieser',
      items: [
        { n: 3, kind: 'key', en: 'Key 2: the timed gates', zh: '鑰匙：限時雙閘門',
          where: '打倒 Fieser 後，有個帶倒數的控制台，兩側各有一道閘門。分兩隊：右隊清敵人、射掉對面的箱子幫左隊開門；左隊進去打坦克，坦克掉的鑰匙能開下一道門，裡面就是鑰匙。',
          tip: '倒數很短，動作要非常快。' },
        { n: 4, kind: 'trophy', en: 'Molten', zh: '熔岩（Molten）',
          where: '跟上一把鑰匙是同一段限時機關：右隊清敵人並射兩個電箱打開左側閘門，左隊衝進左邊入口，飾品在靠窗的地上。' },
        { n: 5, kind: 'key', en: 'Key 3: pipes, wheels and power boxes', zh: '鑰匙：水管、轉輪與三個電箱',
          where: '下一個可以往下跳的區域分兩步。①轉輪開大鐵門後，衝去打爆左上和右上兩根水管（撿對面敵人掉的火箭筒最快）；中間上方的狙擊手只能壓制不能殺。四個人爬梯子同時轉兩邊共四個轉輪，狙擊手會死並掉出一把鑰匙。②把這把鑰匙插進黃色控制台，三個電箱會短暫露出：右側上層黃色控制台對面窗戶裡、地面右側藍色貨櫃後（找及腰的木柵欄）、最遠端射斷繩子後左側屋頂大彎管底下。三個都炸掉後，原本三個紅燈的門變綠，進去拿鑰匙。',
          tip: '電箱露出後一兩秒就會擋住，三個人要事先瞄好、同時開火。' },
      ],
    },
    {
      zh: 'Williams 少校前後', en: 'Around Major Williams',
      items: [
        { n: 6, kind: 'trophy', en: 'High Ground', zh: '制高點（High Ground）',
          where: '進 Williams 頭目房之前，有一間圓形房間，裡面有幾個紅色六角齒輪，全部射掉。飾品出現在通往頭目房走廊前、一個及腰高的淡藍色工具箱裡。' },
        { n: 7, kind: 'key', en: 'Key 4: the hazard corridor', zh: '鑰匙：陷阱長廊',
          where: '打倒 Williams 後往最終頭目走的長廊陷阱很多。開閘門後跑上樓梯，快速衝到盡頭可以往下跳的地方，跳下去後跑到對面的金屬發電機，兩個人同時扳兩支把手關掉電流。再上樓開門，拉下拉桿打開底層的閘門，鑰匙在裡面。',
          tip: '帶高危害防護；兩支把手要同時扳。' },
      ],
    },
    {
      zh: 'Morozova 上校', en: 'Colonel Morozova',
      items: [
        { n: 8, kind: 'key', en: 'Key 5: Morozova drop', zh: '鑰匙：Morozova 必掉',
          where: '最終頭目 Morozova 必定掉落。湊齊 5 把就能開終點寶箱。' },
        { n: 9, kind: 'trophy', en: 'Iron Horse', zh: '鐵馬（Iron Horse）',
          where: '打倒 Morozova 後五門砲會爆炸，最大那門的砲管會掉到地上，檢查砲管開口，飾品在裡面。' },
        { n: 10, kind: 'trophy', en: 'Old Guard', zh: '老兵（Old Guard）',
          where: '完成整個鐵馬掠奪戰就會獲得。' },
      ],
    },
  ],
  link: (item: CollectItem) => (item.kind === 'trophy' ? TROPHIES : KEYS),
};
