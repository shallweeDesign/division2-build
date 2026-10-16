/**
 * 地圖頁 / The D.C. map: missions, strongholds and the Red Moon altars on a
 * real-world base map, with today's targeted loot on the missions it drops in.
 *
 * Base map: OpenFreeMap's dark style (OpenStreetMap data, no key). MapLibre
 * draws it; the pins are plain DOM markers — there are only a few dozen.
 *
 * Altar ticks are per day (they respawn at the 08:00 UTC reset) and per
 * browser, kept in localStorage under that day's date, so yesterday's ticks
 * simply stop applying. Which layers are shown is remembered the same way.
 */
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 runs its tile work in a module worker that imports a shared
// chunk; Vite has to bundle that worker itself, or the URL it ends up with
// points at a file that is not there and the base map stays black.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { lang, t } from '../i18n/index.ts';
import { lootZh, missionZh } from '../i18n/loot.ts';
import { looseKey } from '../model/loot-vocab.ts';
import { loadLoot, localClock, nextReset, rotationDate } from '../model/loot.ts';
import type { LootSnapshot } from '../model/loot.ts';
import { ALTARS, MAP_CENTER, MISSIONS, RED_MOON, STRONGHOLDS } from '../data/map/places.ts';
import type { MapPlace, PlaceKind } from '../data/map/places.ts';
import { el } from './dom.ts';

const STYLE = 'https://tiles.openfreemap.org/styles/dark';
maplibregl.setWorkerUrl(workerUrl);

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

/** 瀏覽器儲存 / localStorage that may be missing or throw (private mode). */
const store = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* not kept; fine */ }
  },
};

const LAYERS_KEY = 'd2b.map.layers';
const altarKey = () => `d2b.map.altars.${rotationDate()}`;

type Layers = Record<PlaceKind, boolean>;
const layers: Layers = { mission: true, stronghold: true, altar: true, ...store.get<Partial<Layers>>(LAYERS_KEY, {}) };
let found = new Set<number>(store.get<number[]>(altarKey(), []));

const altarNo = (p: MapPlace) => Number(p.id.slice('altar-'.length));
const eventOn = (day = rotationDate()) => day >= RED_MOON.start && day <= RED_MOON.end;

let map: maplibregl.Map | null = null;
const markers = new Map<string, { place: MapPlace; marker: maplibregl.Marker; node: HTMLElement }>();
let loot: LootSnapshot | null = null;

/** Today's target at a mission, matched loosely ("Viewpoint" / "ViewPoint"). */
const lootAt = (p: MapPlace) =>
  loot?.missions.find((m) => looseKey(m.mission) === looseKey(p.en))?.loot;

const lootName = (word: string) => (lang() === 'zh-tw' ? lootZh(word) ?? word : word);
const placeName = (p: MapPlace) =>
  p.kind === 'altar' ? (lang() === 'zh-tw' ? p.zh! : p.en) : (lang() === 'zh-tw' ? missionZh(p.en) ?? p.en : p.en);

function popupContent(p: MapPlace) {
  const target = p.kind === 'mission' ? lootAt(p) : undefined;
  const zh = lang() === 'zh-tw';
  return el('div', { class: 'map-pop' }, [
    el('span', { class: `map-pop-kind kind-${p.kind}` }, [t(`mapKind_${p.kind}` as const)]),
    el('strong', {}, [placeName(p)]),
    el('span', { class: 'map-pop-district' }, [p.district]),
    p.where ? el('p', {}, [zh ? p.where.zh : p.where.en]) : null,
    target ? el('p', { class: 'map-pop-loot' }, [t('mapTodayLoot'), ' ', el('b', {}, [lootName(target)])]) : null,
    p.basedOn ? el('p', { class: 'map-pop-note' }, [fill(t('mapBasedOn'), { b: p.basedOn })]) : null,
    p.precision === 'approx' ? el('p', { class: 'map-pop-note' }, [t('mapApprox')]) : null,
    p.kind === 'altar'
      ? el('label', { class: 'map-pop-check' }, [
        el('input', {
          type: 'checkbox', checked: found.has(altarNo(p)),
          onchange: () => { toggleAltar(altarNo(p)); },
        }),
        t('mapAltarDone'),
      ])
      : null,
  ]);
}

function pinNode(p: MapPlace) {
  const label = p.kind === 'altar' ? String(altarNo(p)) : '';
  const node = el('button', {
    class: `map-pin kind-${p.kind}${p.kind === 'mission' && lootAt(p) ? ' has-loot' : ''}${p.kind === 'altar' && found.has(altarNo(p)) ? ' done' : ''}`,
    type: 'button',
    'aria-label': placeName(p),
    title: placeName(p),
  }, [label]);
  return node;
}

function placeMarkers() {
  if (!map) return;
  for (const { marker } of markers.values()) marker.remove();
  markers.clear();
  for (const p of [...STRONGHOLDS, ...MISSIONS, ...ALTARS]) {
    if (!layers[p.kind] || (p.kind === 'altar' && !eventOn())) continue;
    const node = pinNode(p);
    const popup = new maplibregl.Popup({ offset: 14, maxWidth: '260px' });
    popup.on('open', () => popup.setDOMContent(popupContent(p)));
    const marker = new maplibregl.Marker({ element: node }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
    markers.set(p.id, { place: p, marker, node });
  }
}

function toggleAltar(n: number) {
  if (found.has(n)) found.delete(n); else found.add(n);
  store.set(altarKey(), [...found]);
  markers.get(`altar-${n}`)?.node.classList.toggle('done', found.has(n));
  onChange();
}

function flyTo(id: string) {
  const m = markers.get(id);
  if (!map || !m) return;
  map.flyTo({ center: [m.place.lng, m.place.lat], zoom: Math.max(map.getZoom(), 15) });
  if (!m.marker.getPopup()?.isOpen()) m.marker.togglePopup();
}

let onChange = () => {};

function renderPanel(panel: HTMLElement) {
  const day = rotationDate();
  // A new reset since the ticks were loaded: start the day clean.
  found = new Set(store.get<number[]>(altarKey(), []));

  const toggle = (kind: PlaceKind, count: number, disabled = false) => el('label', { class: `map-toggle kind-${kind}` }, [
    el('input', {
      type: 'checkbox', checked: layers[kind] && !disabled, disabled,
      onchange: (e: Event) => {
        layers[kind] = (e.target as HTMLInputElement).checked;
        store.set(LAYERS_KEY, layers);
        placeMarkers();
      },
    }),
    el('span', { class: 'map-swatch' }),
    `${t(`mapLayer_${kind}` as const)} (${count})`,
  ]);

  const missionsToday = loot?.missions ?? [];
  const onMap = (name: string) => MISSIONS.find((p) => looseKey(p.en) === looseKey(name));

  panel.replaceChildren(
    el('section', { class: 'map-card' }, [
      el('h2', { class: 'col-heading' }, [t('mapLayers')]),
      toggle('mission', MISSIONS.length),
      toggle('stronghold', STRONGHOLDS.length),
      toggle('altar', ALTARS.length, !eventOn(day)),
    ]),
    el('section', { class: 'map-card map-altars' }, [
      el('h2', { class: 'col-heading' }, [t('mapAltarsTitle')]),
      eventOn(day)
        ? el('div', {}, [
          el('p', { class: 'map-progress' }, [
            el('strong', {}, [fill(t('mapAltarProgress'), { n: String(found.size), total: String(ALTARS.length) })]),
            el('span', { class: 'collect-bar' }, [el('span', { class: 'collect-bar-fill', style: `width:${(found.size / ALTARS.length) * 100}%` })]),
          ]),
          el('p', { class: 'map-note' }, [fill(t('mapAltarReset'), { t: localClock(nextReset()) })]),
          el('ol', { class: 'map-altar-list' }, ALTARS.map((p) => el('li', { class: found.has(altarNo(p)) ? 'done' : '' }, [
            el('input', {
              type: 'checkbox', checked: found.has(altarNo(p)), 'aria-label': placeName(p),
              onchange: () => toggleAltar(altarNo(p)),
            }),
            el('button', { type: 'button', class: 'linkish', onclick: () => flyTo(p.id) }, [`#${altarNo(p)} ${p.district}`]),
          ]))),
          el('button', {
            class: 'ghost', type: 'button',
            onclick: () => { found.clear(); store.set(altarKey(), []); placeMarkers(); onChange(); },
          }, [t('collectReset')]),
        ])
        : el('p', { class: 'map-note' }, [fill(t('mapEventOff'), { a: RED_MOON.start, b: RED_MOON.end })]),
      el('p', { class: 'map-note' }, [
        t('mapAltarSource'), ' ',
        el('a', { href: RED_MOON.guide, target: '_blank', rel: 'noopener' }, ['Sportskeeda']), ' · ',
        el('a', { href: RED_MOON.video, target: '_blank', rel: 'noopener' }, [t('mapAltarVideo')]),
      ]),
    ]),
    el('section', { class: 'map-card' }, [
      el('h2', { class: 'col-heading' }, [t('mapLootTitle')]),
      missionsToday.length
        ? el('ul', { class: 'map-loot-list' }, missionsToday.map((m) => {
          const place = onMap(m.mission);
          return el('li', {}, [
            place
              ? el('button', { type: 'button', class: 'linkish', onclick: () => flyTo(place.id) }, [missionZh(m.mission) ?? m.mission])
              : el('span', { title: t('mapNotOnMap') }, [missionZh(m.mission) ?? m.mission, el('small', {}, [` · ${t('mapNotOnMap')}`])]),
            el('b', {}, [lootName(m.loot)]),
          ]);
        }))
        : el('p', { class: 'map-note' }, [t(loot ? 'mapLootNone' : 'detailLoading')]),
    ]),
    el('p', { class: 'map-note' }, [t('mapApproxAll')]),
  );
}

export function renderMapPage(root: HTMLElement) {
  let panel = root.querySelector<HTMLElement>('.map-panel');
  if (!panel) {
    panel = el('aside', { class: 'map-panel' });
    const canvas = el('div', { class: 'map-canvas' });
    root.replaceChildren(canvas, panel);
    map = new maplibregl.Map({ container: canvas, style: STYLE, center: MAP_CENTER, zoom: 13.4, minZoom: 11, maxZoom: 18 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', placeMarkers);
    void loadLoot().then((snap) => { loot = snap; placeMarkers(); renderPanel(panel!); });
  }
  const p = panel;
  onChange = () => renderPanel(p);
  renderPanel(p);
  if (map?.loaded()) placeMarkers();
}
