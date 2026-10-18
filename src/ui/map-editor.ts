/**
 * 位置編輯 / The position editor: drag any pin, or any corner of the district
 * lines, then save the corrections to `map/overrides` for the map page.
 *
 * Corners shared by several districts (and by the game-area outline) are one
 * handle: they were drawn from the same street lines, so moving a corner
 * moves it in every ring that has it, and borders stay shared.
 *
 * Saving needs the owner's Google account (`firestore.rules`). Anyone else
 * can drag, but the save comes back "permission denied"; signed in, the panel
 * shows the account's uid and the rule that would let it write.
 */
import { t } from '../i18n/index.ts';
import { missionZh } from '../i18n/loot.ts';
import { ALTARS, DISTRICTS, GAME_AREA, MISSIONS, STRONGHOLDS } from '../data/map/places.ts';
import type { MapPlace } from '../data/map/places.ts';
import {
  AREA_KEY, applyOverrides, emptyOverrides, encodeOverrides, loadMapOverrides,
} from '../data/map/overrides.ts';
import type { LngLat, MapOverrides } from '../data/map/overrides.ts';
import { cloudState, onCloudState, saveMapOverrides } from '../cloud/sync.ts';
import { mergeNearby } from '../data/map/merge.ts';
import { addAreaLayers, createMap, maplibregl, setAreaData } from './map-base.ts';
import { el } from './dom.ts';

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

const DEFAULT_PINS = new Map([...MISSIONS, ...STRONGHOLDS, ...ALTARS].map((p) => [p.id, [p.lng, p.lat] as LngLat]));
const DEFAULT_RINGS = new Map<string, LngLat[]>([...DISTRICTS.map((d) => [d.name, d.ring] as [string, LngLat[]]), [AREA_KEY, GAME_AREA]]);

const same = (a: LngLat, b: LngLat) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
const copyRings = (rings: Map<string, LngLat[]>) => new Map([...rings].map(([k, r]) => [k, r.map((p) => [...p] as LngLat)]));

/** Working state: every position, saved or not. */
let pins = new Map(DEFAULT_PINS);
let rings = copyRings(DEFAULT_RINGS);
/** What was last loaded or saved, to tell what is unsaved. */
let savedPins = new Map(pins);
let savedRings = copyRings(rings);

let map: maplibregl.Map | null = null;
let selected = '';
let status: { kind: 'idle' | 'saving' | 'ok' | 'error'; text?: string } = { kind: 'idle' };
let confirmReset = false;
let panel: HTMLElement;
let toolbar: HTMLElement;

/** 工具 / What a click or drag on the map does right now. */
type Tool = 'move' | 'add' | 'delete';
let tool: Tool = 'move';
/** Corners closer than this on screen snap together when one is dropped. */
const SNAP_PX = 12;
/** "Merge nearby corners" joins corners closer than this on the ground. */
const MERGE_M = 12;

const places: MapPlace[] = [...STRONGHOLDS, ...MISSIONS, ...ALTARS];
const nameOf = (id: string) => {
  const p = places.find((x) => x.id === id);
  if (p) return p.kind === 'altar' ? p.zh! : missionZh(p.en) ?? p.en;
  return id === AREA_KEY ? t('mapEditArea') : id;
};

function overridesNow(): MapOverrides {
  const ov = emptyOverrides();
  for (const [id, at] of pins) if (!same(at, DEFAULT_PINS.get(id)!)) ov.pins[id] = [r6(at[0]), r6(at[1])];
  for (const [k, ring] of rings) {
    const def = DEFAULT_RINGS.get(k)!;
    if (ring.length !== def.length || ring.some((p, i) => !same(p, def[i]!))) ov.rings[k] = ring.map((p) => [r6(p[0]), r6(p[1])] as LngLat);
  }
  return ov;
}

const unsaved = () => [
  ...[...pins].filter(([id, at]) => !same(at, savedPins.get(id)!)).map(([id]) => id),
  ...[...rings].filter(([k, r]) => {
    const was = savedRings.get(k)!;
    return r.length !== was.length || r.some((p, i) => !same(p, was[i]!));
  }).map(([k]) => k),
];

function redrawAreas() {
  if (!map) return;
  const districts = DISTRICTS.map((d) => ({ name: d.name, ring: rings.get(d.name)! }));
  setAreaData(map, districts, rings.get(AREA_KEY)!);
}

const pinMarkers = new Map<string, maplibregl.Marker>();
const vertexMarkers: maplibregl.Marker[] = [];

function placePins() {
  if (!map) return;
  for (const m of pinMarkers.values()) m.remove();
  pinMarkers.clear();
  for (const p of places) {
    const node = el('div', {
      class: `map-pin kind-${p.kind}${selected === p.id ? ' selected' : ''}`,
      title: nameOf(p.id),
    }, [p.kind === 'altar' ? p.id.slice('altar-'.length) : '']);
    const m = new maplibregl.Marker({ element: node, draggable: tool === 'move' }).setLngLat(pins.get(p.id)!).addTo(map);
    m.on('dragstart', () => { selected = p.id; renderPanel(); });
    m.on('drag', () => { const ll = m.getLngLat(); pins.set(p.id, [ll.lng, ll.lat]); renderPanel(); });
    m.on('dragend', () => { status = { kind: 'idle' }; renderPanel(); });
    node.addEventListener('click', () => { selected = p.id; renderPanel(); });
    pinMarkers.set(p.id, m);
  }
}

type Ref = { key: string; i: number };

/** Remove refs' points from their rings, keeping each ring closed and ≥ 3 corners. */
function removeCorner(refs: Ref[]) {
  const byRing = new Map<string, number[]>();
  for (const { key, i } of refs) byRing.set(key, [...(byRing.get(key) ?? []), i]);
  for (const [key, idx] of byRing) if (rings.get(key)!.length - 1 - idx.length < 3) return false;
  for (const [key, idx] of byRing) {
    const ring = rings.get(key)!;
    const open = ring.slice(0, -1).filter((_, i) => !idx.includes(i));
    rings.set(key, [...open, [...open[0]!] as LngLat]);
  }
  return true;
}

/** Insert `point` (the same array) after each ref's index, in every ring that has the edge. */
function insertOnEdge(refs: Ref[], point: LngLat) {
  const byRing = new Map<string, number[]>();
  for (const { key, i } of refs) byRing.set(key, [...(byRing.get(key) ?? []), i]);
  for (const [key, idx] of byRing) {
    const ring = rings.get(key)!;
    for (const i of idx.sort((x, y) => y - x)) ring.splice(i + 1, 0, point);
  }
}

/** Give each ring its own copies again, and drop any point now repeated in a row. */
function settle() {
  for (const ring of rings.values()) ring.forEach((p, i) => { ring[i] = [p[0], p[1]]; });
  rings = mergeNearby(rings, 0.01).rings;
}

/** A corner dropped within SNAP_PX of another lands exactly on it. */
function snapTarget(at: LngLat, exclude: LngLat | null): LngLat | null {
  if (!map) return null;
  const here = map.project(at);
  let best: LngLat | null = null;
  let bestD = SNAP_PX;
  for (const ring of rings.values()) {
    for (const p of ring) {
      if (exclude && same(p, exclude)) continue;
      const d = here.dist(map.project(p));
      if (d > 0 && d < bestD) { bestD = d; best = p; }
    }
  }
  return best ? [best[0], best[1]] : null;
}

let edges: { a: LngLat; b: LngLat; refs: Ref[] }[] = [];

/**
 * 頂點與中點 / One handle per distinct corner, acting on every ring that has it:
 * drag to move (move tool, snapping onto a nearby corner), click to delete
 * (delete tool). With the add tool, a "+" sits at each edge's midpoint —
 * click or drag it to insert a corner — and a click anywhere on a line adds
 * one there. Inserting on a shared edge adds the corner on both sides.
 */
function placeVertices() {
  if (!map) return;
  for (const m of vertexMarkers) m.remove();
  vertexMarkers.length = 0;

  const groups: { at: LngLat; refs: Ref[] }[] = [];
  edges = [];
  for (const [key, ring] of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const p = ring[i]!, q = ring[i + 1]!;
      const g = groups.find((x) => same(x.at, p));
      if (g) g.refs.push({ key, i }); else groups.push({ at: [...p] as LngLat, refs: [{ key, i }] });
      const e = edges.find((x) => (same(x.a, p) && same(x.b, q)) || (same(x.a, q) && same(x.b, p)));
      if (e) e.refs.push({ key, i }); else edges.push({ a: p, b: q, refs: [{ key, i }] });
    }
  }

  const deleteCorner = (g: { refs: Ref[] }) => {
    if (removeCorner(g.refs)) { status = { kind: 'idle' }; redrawAreas(); placeVertices(); }
    else status = { kind: 'error', text: t('mapEditMinCorners') };
    renderPanel();
  };

  for (const g of groups) {
    const node = el('div', { class: `map-vertex tool-${tool}`, title: g.refs.map((r) => nameOf(r.key)).join(' · ') });
    const m = new maplibregl.Marker({ element: node, draggable: tool === 'move' }).setLngLat(g.at).addTo(map);
    const start: LngLat = [...g.at] as LngLat;
    const moveTo = (ll: LngLat) => {
      for (const { key, i } of g.refs) {
        const ring = rings.get(key)!;
        ring[i] = [ll[0], ll[1]];
        if (i === 0) ring[ring.length - 1] = [ll[0], ll[1]];
      }
      g.at = ll;
    };
    m.on('drag', () => {
      const ll = m.getLngLat();
      moveTo([ll.lng, ll.lat]);
      selected = g.refs[0]!.key;
      redrawAreas();
      renderPanel();
    });
    m.on('dragend', () => {
      const snap = snapTarget(g.at, start);
      if (snap) moveTo(snap);
      settle();
      status = snap ? { kind: 'ok', text: t('mapEditSnapped') } : { kind: 'idle' };
      redrawAreas();
      placeVertices();
      renderPanel();
    });
    node.addEventListener('click', (e) => {
      if (tool !== 'delete') return;
      e.stopPropagation();
      deleteCorner(g);
    });
    node.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (tool === 'move') deleteCorner(g);
    });
    vertexMarkers.push(m);
  }

  if (tool !== 'add') return;
  for (const e of edges) {
    const mid: LngLat = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    const node = el('div', { class: 'map-midpoint', title: t('mapEditAddCorner') }, ['+']);
    const m = new maplibregl.Marker({ element: node, draggable: true }).setLngLat(mid).addTo(map);
    // The same array goes into every ring sharing the edge, so one drag moves them all.
    const point: LngLat = [...mid] as LngLat;
    let inserted = false;
    const insert = () => {
      if (inserted) return;
      inserted = true;
      insertOnEdge(e.refs, point);
      node.classList.add('map-vertex');
      selected = e.refs[0]!.key;
    };
    m.on('dragstart', insert);
    m.on('drag', () => {
      const ll = m.getLngLat();
      point[0] = ll.lng; point[1] = ll.lat;
      redrawAreas();
      renderPanel();
    });
    m.on('dragend', () => {
      const snap = snapTarget(point, null);
      if (snap) { point[0] = snap[0]; point[1] = snap[1]; }
      settle();
      status = { kind: 'idle' };
      redrawAreas();
      placeVertices();
      renderPanel();
    });
    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      insert();
      settle();
      status = { kind: 'idle' };
      redrawAreas();
      placeVertices();
      renderPanel();
    });
    vertexMarkers.push(m);
  }
}

/** With the add tool, a click within a few pixels of a line adds a corner there. */
function addOnLine(at: maplibregl.LngLat) {
  if (!map || tool !== 'add') return;
  const c = map.project(at);
  let best: { e: (typeof edges)[number]; p: LngLat; d: number } | null = null;
  for (const e of edges) {
    const a = map.project(e.a), b = map.project(e.b);
    const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (!len2) continue;
    const tt = Math.max(0, Math.min(1, ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / len2));
    if (tt < 0.02 || tt > 0.98) continue; // that is a corner, not an edge
    const px = { x: a.x + tt * (b.x - a.x), y: a.y + tt * (b.y - a.y) };
    const d = Math.hypot(c.x - px.x, c.y - px.y);
    if (d < 10 && (!best || d < best.d)) {
      const ll = map.unproject([px.x, px.y]);
      best = { e, p: [ll.lng, ll.lat], d };
    }
  }
  if (!best) return;
  insertOnEdge(best.e.refs, best.p);
  settle();
  selected = best.e.refs[0]!.key;
  status = { kind: 'idle' };
  redrawAreas();
  placeVertices();
  renderPanel();
}

function mergeAll() {
  const { rings: merged, moved } = mergeNearby(rings, MERGE_M);
  rings = merged;
  status = { kind: 'ok', text: fill(t(moved ? 'mapEditMerged' : 'mapEditMergedNone'), { n: String(moved), m: String(MERGE_M) }) };
  redrawAreas();
  placeVertices();
  renderPanel();
}

/** 浮動工具列 / The tool buttons floating over the map. */
function renderToolbar() {
  if (!toolbar) return;
  const btn = (id: Tool, icon: string, label: string) => el('button', {
    type: 'button', class: `map-tool${tool === id ? ' active' : ''}`, title: label, 'aria-pressed': tool === id ? 'true' : 'false',
    onclick: () => { tool = id; placePins(); placeVertices(); renderToolbar(); },
  }, [el('span', { class: 'map-tool-icon', 'aria-hidden': 'true' }, [icon]), label]);
  toolbar.replaceChildren(
    btn('move', '✥', t('mapToolMove')),
    btn('add', '+', t('mapToolAdd')),
    btn('delete', '×', t('mapToolDelete')),
    el('span', { class: 'map-tool-sep' }),
    el('button', { type: 'button', class: 'map-tool', title: fill(t('mapToolMergeHint'), { m: String(MERGE_M) }), onclick: mergeAll }, [
      el('span', { class: 'map-tool-icon', 'aria-hidden': 'true' }, ['⊕']), t('mapToolMerge'),
    ]),
  );
  toolbar.dataset.tool = tool;
}

function loadFrom(ov: MapOverrides) {
  const cur = applyOverrides(ov);
  pins = new Map([...cur.strongholds, ...cur.missions, ...cur.altars].map((p) => [p.id, [p.lng, p.lat] as LngLat]));
  rings = new Map<string, LngLat[]>([...cur.districts.map((d) => [d.name, d.ring.map((p) => [...p] as LngLat)] as [string, LngLat[]]), [AREA_KEY, cur.area.map((p) => [...p] as LngLat)]]);
  savedPins = new Map(pins);
  savedRings = copyRings(rings);
  redrawAreas();
  placePins();
  placeVertices();
  renderPanel();
}

async function save(ov: MapOverrides) {
  status = { kind: 'saving' };
  renderPanel();
  try {
    await saveMapOverrides(encodeOverrides(ov));
    savedPins = new Map(pins);
    savedRings = copyRings(rings);
    status = { kind: 'ok' };
  } catch (e) {
    const code = (e as { code?: string }).code ?? (e as Error).message;
    status = { kind: 'error', text: code === 'not-signed-in' ? t('mapEditNeedSignIn') : code === 'permission-denied' ? t('mapEditDenied') : code };
  }
  renderPanel();
}

const rulesFor = (uid: string) => `match /map/{doc} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == '${uid}'
    && request.resource.data.keys().hasOnly(['pins', 'rings', 'updatedAt']);
}`;

function renderPanel() {
  if (!panel) return;
  const changed = unsaved();
  const sel = selected;
  const selAt = sel ? pins.get(sel) : undefined;
  const user = cloudState().user;
  const totalOverrides = overridesNow();
  const overrideCount = Object.keys(totalOverrides.pins).length + Object.keys(totalOverrides.rings).length;

  panel.replaceChildren(
    el('section', { class: 'map-card' }, [
      el('h2', { class: 'col-heading' }, [t('mapEditTitle')]),
      el('p', { class: 'map-note' }, [t('mapEditHelp')]),
      sel
        ? el('p', { class: 'map-edit-sel' }, [
          el('strong', {}, [nameOf(sel)]),
          selAt ? el('code', {}, [`${r6(selAt[1])}, ${r6(selAt[0])}`]) : null,
        ])
        : null,
    ]),
    el('section', { class: 'map-card' }, [
      el('p', { class: 'map-progress' }, [
        el('strong', {}, [fill(t('mapEditUnsaved'), { n: String(changed.length) })]),
      ]),
      changed.length ? el('ul', { class: 'map-edit-list' }, changed.map((id) => el('li', {}, [nameOf(id)]))) : null,
      el('div', { class: 'map-edit-actions' }, [
        el('button', {
          type: 'button', class: 'primary', disabled: !changed.length || status.kind === 'saving',
          onclick: () => { void save(totalOverrides); },
        }, [status.kind === 'saving' ? t('mapEditSaving') : t('mapEditSave')]),
        el('button', {
          type: 'button', class: 'ghost', disabled: !changed.length,
          onclick: () => {
            pins = new Map(savedPins); rings = copyRings(savedRings);
            redrawAreas(); placePins(); placeVertices(); renderPanel();
          },
        }, [t('mapEditDiscard')]),
      ]),
      status.kind === 'ok' ? el('p', { class: 'map-note ok' }, [status.text ?? t('mapEditSaved')]) : null,
      status.kind === 'error' ? el('p', { class: 'map-note error' }, [status.text ?? '']) : null,
      el('p', { class: 'map-note' }, [fill(t('mapEditOverrides'), { n: String(overrideCount) })]),
      overrideCount
        ? el('button', {
          type: 'button', class: 'ghost',
          onclick: () => {
            if (!confirmReset) { confirmReset = true; renderPanel(); return; }
            confirmReset = false;
            pins = new Map(DEFAULT_PINS); rings = copyRings(DEFAULT_RINGS);
            redrawAreas(); placePins(); placeVertices();
            void save(emptyOverrides());
          },
        }, [confirmReset ? t('mapEditResetConfirm') : t('mapEditReset')])
        : null,
    ]),
    user
      ? el('details', { class: 'map-card map-edit-owner', open: status.kind === 'error' }, [
        el('summary', { class: 'col-heading' }, [t('mapEditOwner')]),
        el('p', { class: 'map-note' }, [fill(t('mapEditUid'), { email: user.email })]),
        el('code', { class: 'map-edit-uid' }, [user.uid]),
        el('p', { class: 'map-note' }, [t('mapEditRulesHelp')]),
        el('pre', { class: 'map-edit-rules' }, [rulesFor(user.uid)]),
      ])
      : el('p', { class: 'map-note' }, [t('mapEditNeedSignIn')]),
    el('p', { class: 'map-note' }, [
      el('a', { href: `${import.meta.env.BASE_URL}map/` }, [t('mapEditBack')]),
    ]),
  );
}

export function renderMapEditor(root: HTMLElement) {
  if (!map) {
    panel = el('aside', { class: 'map-panel' });
    const canvas = el('div', { class: 'map-canvas' });
    toolbar = el('div', { class: 'map-toolbar', role: 'toolbar', 'aria-label': t('mapEditTitle') });
    const wrap = el('div', { class: 'map-canvas-wrap' }, [canvas, toolbar]);
    root.replaceChildren(wrap, panel);
    map = createMap(canvas);
    map.on('click', (e) => addOnLine(e.lngLat));
    map.doubleClickZoom.disable(); // double-click deletes a corner here
    map.on('load', () => {
      addAreaLayers(map!, DISTRICTS, GAME_AREA);
      placePins();
      placeVertices();
      void loadMapOverrides().then(loadFrom);
    });
    onCloudState(() => renderPanel());
  }
  renderToolbar();
  renderPanel();
}
