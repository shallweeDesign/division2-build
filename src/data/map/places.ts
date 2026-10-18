/**
 * 地圖地點 / What the map page pins: main missions, strongholds and this
 * season's Red Moon altars, on a real-world map of Washington, D.C.
 *
 * The game's D.C. is rebuilt on the real street grid, so real coordinates
 * work — but only a place the game names after a real one (Lincoln Memorial,
 * the Capitol) can be pinned exactly. Everything else is `approx`: placed in
 * its district by eye, a block or two out, and the page says so.
 *
 * Districts come from the Fandom wiki's mission pages (2026-10-16). Mission
 * names stay English on purpose, as on the loot page (`MISSION_ZH`).
 */

export type PlaceKind = 'mission' | 'stronghold' | 'altar';
export type Precision = 'exact' | 'approx';

export interface MapPlace {
  id: string;
  kind: PlaceKind;
  /** The game's name; for missions also the key the loot snapshot uses. */
  en: string;
  zh?: string;
  district: string;
  lat: number;
  lng: number;
  precision: Precision;
  /** Where to look, in our words. */
  where?: { zh: string; en: string };
  /** The real building the game's version is modelled on, when it is fictional. */
  basedOn?: string;
}

const mission = (id: string, en: string, district: string, lat: number, lng: number, precision: Precision, basedOn?: string): MapPlace =>
  ({ id, kind: 'mission', en, district, lat, lng, precision, basedOn });
const stronghold = (id: string, en: string, district: string, lat: number, lng: number, precision: Precision, basedOn?: string): MapPlace =>
  ({ id, kind: 'stronghold', en, district, lat, lng, precision, basedOn });

/** 主線任務 / D.C. main missions (Camp White Oak and DARPA left out: no location we could check). */
export const MISSIONS: MapPlace[] = [
  mission('grand-washington-hotel', 'Grand Washington Hotel', 'Downtown East', 38.8990, -77.0270, 'approx'),
  mission('viewpoint-museum', 'ViewPoint Museum', 'Federal Triangle', 38.8931, -77.0193, 'approx', 'Newseum'),
  mission('american-history-museum', 'American History Museum', 'East Mall', 38.8913, -77.0300, 'exact'),
  mission('air-space-museum', 'Air & Space Museum', 'East Mall', 38.8882, -77.0199, 'exact'),
  mission('jefferson-plaza', 'Jefferson Plaza', 'Southwest', 38.8847, -77.0250, 'approx'),
  mission('bank-headquarters', 'Bank Headquarters', 'Downtown West', 38.9040, -77.0400, 'approx'),
  mission('dcd-headquarters', 'DCD Headquarters', 'Constitution Hall', 38.8940, -77.0430, 'approx'),
  mission('lincoln-memorial', 'Lincoln Memorial', 'West Potomac Park', 38.8893, -77.0502, 'exact'),
  mission('potomac-event-center', 'Potomac Event Center', 'Foggy Bottom', 38.8957, -77.0558, 'approx', 'Kennedy Center'),
  mission('jefferson-trade-center', 'Jefferson Trade Center', 'Federal Triangle', 38.8935, -77.0315, 'approx', 'Ronald Reagan Building and International Trade Center'),
  mission('space-administration-hq', 'Space Administration HQ', 'Southwest', 38.8830, -77.0163, 'approx', 'NASA Headquarters'),
  mission('federal-emergency-bunker', 'Federal Emergency Bunker', 'West End', 38.9040, -77.0510, 'approx'),
];

/** 據點 / Strongholds. */
export const STRONGHOLDS: MapPlace[] = [
  stronghold('district-union-arena', 'District Union Arena', 'Judiciary Square', 38.8981, -77.0209, 'approx', 'Capital One Arena'),
  stronghold('roosevelt-island', 'Roosevelt Island', 'Roosevelt Island', 38.8966, -77.0644, 'exact'),
  stronghold('capitol-building', 'Capitol Building', 'Capitol Hill', 38.8899, -77.0091, 'exact'),
  stronghold('tidal-basin', 'Tidal Basin', 'West Potomac Park', 38.8814, -77.0365, 'exact'),
  stronghold('manning-national-zoo', 'Manning National Zoo', 'D.C. Outskirts', 38.9296, -77.0498, 'approx', 'Smithsonian National Zoo'),
  stronghold('the-pentagon', 'The Pentagon', 'The Pentagon', 38.8719, -77.0563, 'exact'),
];

/**
 * 血月祭壇 / Red Moon Unleashed (2026-10-15 → 11-03): 20 altars to shoot, each
 * worth one item from the event gear cache, back every day at 08:00 UTC.
 *
 * Numbering and districts follow Sportskeeda's guide (Sankalpa Das,
 * 2026-10-15); each position was read off the in-game map in that guide's
 * screenshots and matched to the real streets by eye, so all are `approx`.
 */
export const RED_MOON = {
  start: '2026-10-15',
  end: '2026-11-03',
  guide: 'https://www.sportskeeda.com/mmo/all-red-moon-altar-locations-the-division-2-y8s3-red-moon-unleashed-event',
  video: 'https://www.youtube.com/watch?v=Gkkw1SCSpf0',
};

const altar = (n: number, district: string, lat: number, lng: number, zh: string, en: string): MapPlace =>
  ({ id: `altar-${n}`, kind: 'altar', en: `Red Moon Altar #${n}`, zh: `血月祭壇 #${n}`, district, lat, lng, precision: 'approx', where: { zh, en } });

export const ALTARS: MapPlace[] = [
  altar(1, 'West End', 38.9000, -77.0540, '高速公路旁的橫樑上。', 'On a beam beside the freeway.'),
  altar(2, 'West End', 38.9013, -77.0488, '路邊建築的陽台上。', "On a street-side building's balcony."),
  altar(3, 'Downtown West', 38.9030, -77.0420, '街上，汽車殘骸旁。', 'At street level next to wrecked cars.'),
  altar(4, 'Downtown West', 38.8985, -77.0405, '路邊一個小平台上。', 'On a small raised ledge by the street.'),
  altar(5, 'Foggy Bottom', 38.8962, -77.0500, '路口附近、廣告看板前，在地面上。', 'At street level in front of a billboard near the intersection.'),
  altar(6, 'Foggy Bottom', 38.8945, -77.0470, '建築轉角施工鷹架的高處。', "High on the scaffolding at a building's corner."),
  altar(7, 'Constitution Hall', 38.8960, -77.0415, '營火旁的施工鷹架上。', 'On construction scaffolding beside a bonfire.'),
  altar(8, 'West Potomac Park', 38.8886, -77.0490, '林肯紀念堂附近的小屋旁。', 'By a small hut near the Lincoln Memorial.'),
  altar(9, 'West Potomac Park', 38.8908, -77.0368, '建築屋頂上，背景看得到華盛頓紀念碑。', 'On a rooftop, with the Washington Monument behind it.'),
  altar(10, 'White House', 38.8995, -77.0365, '悍馬車頂上。', 'On top of a Humvee.'),
  altar(11, 'White House', 38.9010, -77.0372, '巷口的垃圾箱旁。', 'By a dumpster at an alley entrance.'),
  altar(12, 'Downtown East', 38.8995, -77.0240, '拱門角落高處的平台上，有紫色燈光。', 'High on a ledge in the corner of an archway, lit purple.'),
  altar(13, 'Downtown East', 38.9030, -77.0255, '路口附近的人行道上。', 'On the pavement near the intersection.'),
  altar(14, 'Federal Triangle', 38.8935, -77.0235, '圍牆轉角的頂上。', 'On top of a corner of the boundary wall.'),
  altar(15, 'Judiciary Square', 38.8975, -77.0175, 'District Mall 入口的門廊頂上。', 'On the porch roof of the District Mall entrance.'),
  altar(16, 'Judiciary Square', 38.8962, -77.0182, '雕像前。', 'In front of the statue.'),
  altar(17, 'East Mall', 38.8875, -77.0145, '轉角處，建築名牌正下方。', "At a corner, right under the building's name."),
  altar(18, 'East Mall', 38.8870, -77.0105, '機密任務入口附近，鐵柵門後。', 'Behind the fenced gate near the Classified Assignment entrance.'),
  altar(19, 'Southwest', 38.8850, -77.0178, '轉角附近的火車車廂頂上。', 'On top of a train carriage near the corner.'),
  altar(20, 'Southwest', 38.8845, -77.0150, '轉角幾級台階上，周圍都是破椅子。', 'Up a few steps in a corner, among broken chairs.'),
];

/**
 * 分區 / The game's districts in central D.C., drawn along real streets from
 * the district lines in the in-game map screenshots. Approximate like the
 * pins, but every pin above falls inside its own district (tested), so the
 * two hold each other in check. Rings are [lng, lat], closed.
 *
 * Streets used: Rock Creek ≈ -77.0565, 20th ≈ -77.0445, 17th ≈ -77.0396,
 * 15th ≈ -77.0336, 8th ≈ -77.0230, the Capitol ≈ -77.0100; Independence
 * ≈ 38.886, Constitution ≈ 38.892, F ≈ 38.8973, I ≈ 38.902; Pennsylvania
 * Avenue is the diagonal between Downtown East and Federal Triangle.
 */
export interface District {
  name: string;
  ring: [number, number][];
  /** Dark Zones are drawn in their own colour. */
  dark?: boolean;
}

const W = -77.0565, X20 = -77.0445, X17 = -77.0396, X15 = -77.0336, X8 = -77.0230, XC = -77.0100, XE = -77.0000;
const S = 38.8790, IND = 38.8860, CON = 38.8920, F = 38.8973, I = 38.9020, N = 38.9085;
/** Dark Zone South's east and south edges. */
const DZS_E = -77.0270, DZS_S = 38.8815;
const PENN_15: [number, number] = [X15, 38.8957];
const PENN_8: [number, number] = [X8, 38.8942];
const PENN_3: [number, number] = [-77.0140, 38.8925];
const box = (w: number, s: number, e: number, n: number): [number, number][] => [[w, s], [e, s], [e, n], [w, n], [w, s]];
/** A regular pentagon `r` metres from centre to corner, one corner due north-west like the building. */
function pentagon(lng: number, lat: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((-72 * i + 110) * Math.PI) / 180;
    pts.push([
      Math.round((lng + (r * Math.cos(a)) / (111_320 * Math.cos((lat * Math.PI) / 180))) * 1e6) / 1e6,
      Math.round((lat + (r * Math.sin(a)) / 110_540) * 1e6) / 1e6,
    ]);
  }
  return [...pts, pts[0]!];
}

const DRAWN: District[] = [
  { name: 'West End', ring: box(W, F, X20, N) },
  { name: 'Foggy Bottom', ring: box(W, CON, X20, F) },
  { name: 'Constitution Hall', ring: box(X20, CON, X17, F) },
  { name: 'Downtown West', ring: [[X20, F], [X17, F], [X17, I], [X15, I], [X15, N], [X20, N], [X20, F]] },
  { name: 'White House', ring: box(X17, CON, X15, I) },
  { name: 'Downtown East', ring: [PENN_15, PENN_8, [X8, N], [X15, N], PENN_15] },
  { name: 'Federal Triangle', ring: [[X15, CON], [PENN_3[0], CON], PENN_3, PENN_8, PENN_15, [X15, CON]] },
  { name: 'Judiciary Square', ring: [PENN_8, PENN_3, [-77.0110, PENN_3[1]], [-77.0110, N], [X8, N], PENN_8] },
  { name: 'West Potomac Park', ring: box(W, S, X15, CON) },
  { name: 'East Mall', ring: box(X15, IND, XC, CON) },
  // Dark Zone South is cut out of Southwest's north-west corner.
  { name: 'Southwest', ring: [[X15, S], [XC, S], [XC, IND], [DZS_E, IND], [DZS_E, DZS_S], [X15, DZS_S], [X15, S]] },
  { name: 'Capitol Hill', ring: box(XC, 38.8840, XE, 38.8960) },
  // 暗區 / The Dark Zones, from the wiki's zone pages: West is Georgetown
  // (west of Rock Creek), East lies north of the Capitol (Labor Department,
  // Tax Court), South is the waterfront strip from the Agriculture building
  // on Independence Avenue down to Maryland Avenue's linear park.
  {
    name: 'Dark Zone West', dark: true,
    ring: [[W, 38.9030], [W, N], [-77.0720, 38.9150], [-77.0745, 38.9060], [-77.0680, 38.9025], [-77.0610, 38.9012], [W, 38.9030]],
  },
  { name: 'Dark Zone East', dark: true, ring: box(-77.0110, 38.8960, -77.0030, 38.9050) },
  { name: 'Dark Zone South', dark: true, ring: box(X15, DZS_S, DZS_E, IND) },
  // The island's outline, and the Pentagon as the building's own shape.
  {
    name: 'Roosevelt Island',
    ring: [[-77.0680, 38.9010], [-77.0630, 38.9016], [-77.0598, 38.8975], [-77.0618, 38.8930], [-77.0667, 38.8928], [-77.0697, 38.8968], [-77.0680, 38.9010]],
  },
  { name: 'The Pentagon', ring: pentagon(-77.0560, 38.8710, 300) },
];

/**
 * 遊戲範圍 / The outline of the districts above, clockwise, for the mask
 * that darkens everything outside the game's D.C.
 */
const DRAWN_AREA: [number, number][] = [
  [W, N], [-77.0110, N], [-77.0110, 38.8960], [XE, 38.8960], [XE, 38.8840], [XC, 38.8840], [XC, S], [W, S], [W, N],
];

/** How far the map may pan: the game area plus the zoo, the Pentagon and Roosevelt Island. */
export const MAP_BOUNDS: [[number, number], [number, number]] = [[-77.085, 38.862], [-76.988, 38.938]];

/**
 * 共用頂點 / Where one ring's corner sits on another ring's edge (a T-junction,
 * like West Potomac Park's long top edge under three districts' corners),
 * give that edge the corner too. Then every border is made of the same
 * points on both sides, and the editor can move or split it as one.
 */
export function splitAtJunctions(rings: [number, number][][]): [number, number][][] {
  const eps = 1e-9;
  const corners = rings.flatMap((r) => r.slice(0, -1));
  const onSegment = (p: [number, number], a: [number, number], b: [number, number]) => {
    const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(cross) > eps) return false;
    const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
    return t > eps && t < 1 - eps;
  };
  return rings.map((ring) => {
    const out: [number, number][] = [];
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i]!, b = ring[i + 1]!;
      out.push(a);
      const between = corners
        .filter((p, k, all) => onSegment(p, a, b) && all.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === k)
        .sort((p, q) => Math.hypot(p[0] - a[0], p[1] - a[1]) - Math.hypot(q[0] - a[0], q[1] - a[1]));
      out.push(...between);
    }
    out.push(ring[ring.length - 1]!);
    return out;
  });
}

const SPLIT = splitAtJunctions([...DRAWN.map((d) => d.ring), DRAWN_AREA]);
export const DISTRICTS: District[] = DRAWN.map((d, i) => ({ ...d, ring: SPLIT[i]! }));
export const GAME_AREA: [number, number][] = SPLIT[SPLIT.length - 1]!;

/** Point-in-polygon (ray casting), for the tests and nothing else yet. */
export function inRing([lng, lat]: [number, number], ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!, [xj, yj] = ring[j]!;
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 地圖中心 / Where the map opens: the National Mall, framing all of the above but the zoo. */
export const MAP_CENTER: [number, number] = [-77.034, 38.893];
