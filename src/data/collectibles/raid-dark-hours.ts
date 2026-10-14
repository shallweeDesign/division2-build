/**
 * 黑暗時刻行動 / Operation Dark Hours, the first 8-player raid (2019): the
 * hidden key chests, the boss key and the keychain backpack trophy.
 *
 * Keys follow u/Revan10492's r/thedivision post (2019-05-20), the list every
 * later guide copies. That post numbers six keys; we leave out its "#2", a
 * colour-switch door in the courtyard after Weasel that was reported bugged
 * and never solved there, which leaves four chests plus Razorback's drop —
 * matching a 2020 player report of "4 key chests" and the five keys the end
 * chest takes. The trophy follows GosuNoob (2019-05-17).
 *
 * Sources predate later title updates; the Chinese wording is our own, and
 * the zh names are ours too (no official zh-TW names were checked).
 */
import type { Collection, CollectItem } from './types.ts';

const KEYS = 'https://www.reddit.com/r/thedivision/comments/bqxw9n/division_2_dark_hours_raid_key_locations/';
const TROPHY = 'https://www.gosunoob.com/division-2/raid-backpack-keychain-trophy-location-dark-hours/';

export const DARK_HOURS: Collection = {
  id: 'raid-dark-hours',
  tab: { zh: '掠奪戰・黑暗時刻', en: 'Raid · Dark Hours' },
  title: { zh: '黑暗時刻行動：5 把鑰匙與鑰匙圈飾品', en: 'Operation Dark Hours: five keys and the keychain trophy' },
  intro: {
    zh: '舊的八人掠奪戰。湊齊 5 把鑰匙打開終點寶箱（有機會開出 Eagle Bearer），途中還藏著一個背包鑰匙圈飾品。依路線順序排列。',
    en: 'The original 8-player raid. Five keys open the chest at the end (a chance at Eagle Bearer), and a keychain backpack trophy hides on the way. Listed in route order.',
  },
  type: { zh: '掠奪戰（舊）', en: 'Raid (original)' },
  reward: { zh: '終點寶箱：Eagle Bearer 機率約 10%・背包鑰匙圈飾品', en: 'End chest: ~10% Eagle Bearer · keychain backpack trophy' },
  guides: [
    { name: 'r/thedivision (u/Revan10492)', url: KEYS },
    { name: 'GosuNoob', url: TROPHY },
  ],
  source: {
    zh: '鑰匙位置依據 2019 年 Reddit 玩家整理、飾品依據 GosuNoob，之後的改版可能有變動；說明文字為本站改寫。',
    en: 'Keys follow a 2019 Reddit write-up and the trophy GosuNoob; later updates may have changed things. The wording here is our own.',
  },
  rules: [
    '路線：Boomer → 機庫（Dizzy、Ricochet、Weasel）→ 軍犬 Buddy 與 Lucy → Razorback。',
    '終點寶箱要 5 把鑰匙：路上 4 個隱藏鑰匙箱，加上最終頭目 Razorback 掉落的 1 把。',
    '鑰匙不會出現在背包裡，只能在掠奪戰 NPC、白宮直升機坪或掠奪戰內的地圖上看到數量。',
    '隱藏鑰匙箱每週只能開一次；本週已開過的箱子在你畫面上會是打開的狀態。',
    '打完頭目後回頭找也拿不到：發電機、按鈕等機關會失效，該區要當場處理。',
    'Weasel 之後中庭有一扇彩色開關的門，早期被當成鑰匙位置，但回報是錯誤、一直沒人打開，這裡不列入。',
  ],
  stages: [
    {
      zh: 'Boomer 之後', en: 'After Boomer',
      items: [
        { n: 1, kind: 'key', en: 'Key: food court', zh: '鑰匙：美食街角落',
          where: '打倒 Boomer 後來到候機區，左邊有一台發電機，右邊美食街角落（三明治店）有一個按鈕。兩個人同時按發電機和按鈕，美食街角落打開，鑰匙箱就在裡面。',
          tip: '要兩人同步，先講好倒數。' },
      ],
    },
    {
      zh: 'Weasel 之後', en: 'After Weasel',
      items: [
        { n: 2, kind: 'trophy', en: 'Keychain backpack trophy', zh: '背包鑰匙圈飾品',
          where: '打倒 Weasel 後，撬開機庫角落的電梯爬到上層，走上貓道、越過飛機機翼到另一側，沿貓道往左走到底，有燈的小平台上，飾品在幾個金屬箱子中間。',
          tip: '先跟隊友說一聲，別讓他們先往前推進。' },
        { n: 3, kind: 'key', en: 'Key: baggage claim elevator', zh: '鑰匙：行李提領區電梯',
          where: '從繩索下到中庭後，直接衝過下一波敵人進行李提領區，最後面有一座帶倒數的電梯，要在關門前衝進去拿鑰匙箱。',
          tip: '這把要比下一把先拿，晚了電梯就關了。' },
        { n: 4, kind: 'key', en: 'Key: grenade through the window', zh: '鑰匙：從窗戶丟手榴彈',
          where: '中庭往下走、穿過有毒的走廊，右手邊有一間雙開門的房間。往門上方的窗戶丟一顆手榴彈，鑰匙箱就能拿了。' },
      ],
    },
    {
      zh: 'Razorback', en: 'Razorback',
      items: [
        { n: 5, kind: 'key', en: 'Key: before Razorback', zh: '鑰匙：最終頭目前的角落',
          where: '打完軍犬 Buddy 與 Lucy 往航廈走，在進最終頭目戰之前，不要往右走下落區，改往左走，鑰匙箱在角落。' },
        { n: 6, kind: 'key', en: 'Key: Razorback drop', zh: '鑰匙：Razorback 掉落',
          where: '打倒最終頭目 Razorback 後掉落。湊齊 5 把就能打開機尾的終點寶箱。' },
      ],
    },
  ],
  link: (item: CollectItem) => (item.kind === 'trophy' ? TROPHY : KEYS),
};
