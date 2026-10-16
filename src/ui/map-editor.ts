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
    const m = new maplibregl.Marker({ element: node, draggable: true }).setLngLat(pins.get(p.id)!).addTo(map);
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

/**
 * 頂點與中點 / One handle per distinct corner, moving it in every ring that has
 * it; double-click removes it. Between corners, a faint "+" at each edge's
 * midpoint: drag it and a new corner is inserted there, in every ring that
 * shares that edge, so a shared border gains the corner on both sides.
 */
function placeVertices() {
  if (!map) return;
  for (const m of vertexMarkers) m.remove();
  vertexMarkers.length = 0;

  const groups: { at: LngLat; refs: Ref[] }[] = [];
  const edges: { a: LngLat; b: LngLat; refs: Ref[] }[] = [];
  for (const [key, ring] of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const p = ring[i]!, q = ring[i + 1]!;
      const g = groups.find((x) => same(x.at, p));
      if (g) g.refs.push({ key, i }); else groups.push({ at: [...p] as LngLat, refs: [{ key, i }] });
      const e = edges.find((x) => (same(x.a, p) && same(x.b, q)) || (same(x.a, q) && same(x.b, p)));
      if (e) e.refs.push({ key, i }); else edges.push({ a: p, b: q, refs: [{ key, i }] });
    }
  }

  for (const g of groups) {
    const node = el('div', { class: 'map-vertex', title: `${g.refs.map((r) => nameOf(r.key)).join(' · ')}\n${t('mapEditDblDelete')}` });
    const m = new maplibregl.Marker({ element: node, draggable: true }).setLngLat(g.at).addTo(map);
    m.on('drag', () => {
      const ll = m.getLngLat();
      for (const { key, i } of g.refs) {
        const ring = rings.get(key)!;
        ring[i] = [ll.lng, ll.lat];
        if (i === 0) ring[ring.length - 1] = [ll.lng, ll.lat];
      }
      g.at = [ll.lng, ll.lat];
      selected = g.refs[0]!.key;
      redrawAreas();
      renderPanel();
    });
    m.on('dragend', () => { status = { kind: 'idle' }; placeVertices(); renderPanel(); });
    node.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (removeCorner(g.refs)) { status = { kind: 'idle' }; redrawAreas(); placeVertices(); }
      else status = { kind: 'error', text: t('mapEditMinCorners') };
      renderPanel();
    });
    vertexMarkers.push(m);
  }

  for (const e of edges) {
    const mid: LngLat = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    const node = el('div', { class: 'map-midpoint', title: t('mapEditAddCorner') }, ['+']);
    const m = new maplibregl.Marker({ element: node, draggable: true }).setLngLat(mid).addTo(map);
    // The same array goes into every ring sharing the edge, so one drag moves them all.
    const point: LngLat = [...mid] as LngLat;
    m.on('dragstart', () => {
      const byRing = new Map<string, number[]>();
      for (const { key, i } of e.refs) byRing.set(key, [...(byRing.get(key) ?? []), i]);
      for (const [key, idx] of byRing) {
        const ring = rings.get(key)!;
        for (const i of idx.sort((x, y) => y - x)) ring.splice(i + 1, 0, point);
      }
      node.classList.add('map-vertex');
      selected = e.refs[0]!.key;
    });
    m.on('drag', () => {
      const ll = m.getLngLat();
      point[0] = ll.lng; point[1] = ll.lat;
      redrawAreas();
      renderPanel();
    });
    m.on('dragend', () => {
      // Unshare the array again: later drags assign fresh points per ring.
      for (const ring of rings.values()) ring.forEach((p, i) => { if (p === point) ring[i] = [...point] as LngLat; });
      status = { kind: 'idle' };
      placeVertices();
      renderPanel();
    });
    vertexMarkers.push(m);
  }
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
      status.kind === 'ok' ? el('p', { class: 'map-note ok' }, [t('mapEditSaved')]) : null,
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
    root.replaceChildren(canvas, panel);
    map = createMap(canvas);
    map.doubleClickZoom.disable(); // double-click deletes a corner here
    map.on('load', () => {
      addAreaLayers(map!, DISTRICTS, GAME_AREA);
      placePins();
      placeVertices();
      void loadMapOverrides().then(loadFrom);
    });
    onCloudState(() => renderPanel());
  }
  renderPanel();
}
