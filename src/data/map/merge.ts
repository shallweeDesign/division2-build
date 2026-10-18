/**
 * 合併鄰近錨點 / Merge district corners that sit a few metres apart.
 *
 * Dragging corners by hand leaves pairs that were meant to be one point —
 * two districts' corners side by side, or a corner dropped next to a shared
 * one. Merging them makes the border shared again (one handle in the editor,
 * no sliver gap between districts on the map).
 *
 * Each cluster of nearby corners collapses onto the member shared by the
 * most rings, so a corner that already holds several borders stays put and
 * only the strays move. A ring that ends up with the same point twice in a
 * row loses the repeat; a ring that would drop below three corners is left
 * as it was.
 */
export type LngLat = [number, number];

/** Metres between two points, flat-earth — fine at city scale. */
export function metres(a: LngLat, b: LngLat) {
  const k = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot((a[0] - b[0]) * k * 111_320, (a[1] - b[1]) * 110_540);
}

const key = (p: LngLat) => `${p[0]},${p[1]}`;

export function mergeNearby(rings: Map<string, LngLat[]>, within: number) {
  // Distinct corners, and how many rings use each.
  const users = new Map<string, { at: LngLat; rings: Set<string> }>();
  for (const [name, ring] of rings) {
    for (const p of ring.slice(0, -1)) {
      const u = users.get(key(p)) ?? { at: p, rings: new Set<string>() };
      u.rings.add(name);
      users.set(key(p), u);
    }
  }
  const pts = [...users.values()];

  // Union-find over pairs closer than `within`.
  const parent = pts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (metres(pts[i]!.at, pts[j]!.at) < within) parent[find(i)] = find(j);
    }
  }

  // Each cluster's target: the most shared member (first one on a tie).
  const target = new Map<string, LngLat>();
  const clusters = new Map<number, number[]>();
  pts.forEach((_, i) => clusters.set(find(i), [...(clusters.get(find(i)) ?? []), i]));
  let moved = 0;
  for (const members of clusters.values()) {
    if (members.length < 2) continue;
    const best = members.reduce((a, b) => (pts[b]!.rings.size > pts[a]!.rings.size ? b : a));
    for (const m of members) {
      if (m === best) continue;
      target.set(key(pts[m]!.at), pts[best]!.at);
      moved++;
    }
  }

  const out = new Map<string, LngLat[]>();
  for (const [name, ring] of rings) {
    const open = ring.slice(0, -1).map((p) => target.get(key(p)) ?? p);
    const dedup = open.filter((p, i) => key(p) !== key(open[(i + open.length - 1) % open.length]!));
    const unique = new Set(dedup.map(key)).size;
    out.set(name, unique >= 3 ? [...dedup.map((p) => [...p] as LngLat), [...dedup[0]!] as LngLat] : ring);
  }
  return { rings: out, moved };
}
