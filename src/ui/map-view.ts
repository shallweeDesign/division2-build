/**
 * 地圖頁 / The D.C. map: missions, strongholds and the Red Moon altars on a
 * real-world base map, with today's targeted loot on the missions it drops in.
 *
 * The base map and the district layers live in `map-base.ts`. The pins are
 * plain DOM markers — there are only a few dozen. Positions are the built-in
 * ones with the owner's corrections from the position editor laid on top
 * (`data/map/overrides.ts`), fetched without the Firebase SDK.
 *
 * Altar ticks are per day (they respawn at the 08:00 UTC reset) and per
 * browser, kept in localStorage under that day's date, so yesterday's ticks
 * simply stop applying. Which layers are shown is remembered the same way.
 */
import { lang, t } from '../i18n/index.ts';
import { lootZh, missionZh } from '../i18n/loot.ts';
import { lootTone, looseKey } from '../model/loot-vocab.ts';
import { loadLoot, localClock, nextReset, rotationDate } from '../model/loot.ts';
import type { LootSnapshot } from '../model/loot.ts';
import { ALTARS, DISTRICTS, RED_MOON } from '../data/map/places.ts';
import type { MapPlace, PlaceKind } from '../data/map/places.ts';
import { applyOverrides, emptyOverrides, loadMapOverrides } from '../data/map/overrides.ts';
import { DISTRICT_LAYERS, addAreaLayers, createMap, maplibregl, setAreaData } from './map-base.ts';
import { el } from './dom.ts';
import { openLightbox } from './lightbox.ts';
import type { LightboxItem } from './lightbox.ts';
import { onUserData, updateUserData, userData } from '../cloud/user-data.ts';
import { setTicks, ticksFor } from '../data/map/ticks.ts';

/**
 * 祭壇截圖 / The owner's screenshots of each altar, `NN-scene` and `NN-map`,
 * as URLs only: the images load when a popup opens, not with the page.
 */
const ALTAR_SHOTS = import.meta.glob('../assets/map/altars/*.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
type ShotKind = 'scene' | 'map' | 'entrance';
const SHOT_KINDS: ShotKind[] = ['scene', 'map', 'entrance'];
const altarShot = (n: number, kind: ShotKind) =>
  ALTAR_SHOTS[`../assets/map/altars/${String(n).padStart(2, '0')}-${kind}.webp`];

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
const OLD_TICKS = (day: string) => `d2b.map.altars.${day}`;

type Layer = PlaceKind | 'district';
type Layers = Record<Layer, boolean>;
const layers: Layers = { district: true, mission: true, stronghold: true, altar: true, ...store.get<Partial<Layers>>(LAYERS_KEY, {}) };
/**
 * 今日勾選 / Today's ticks live in the player's data, so a signed-in player
 * sees them in every browser. Ticks from before that, kept in localStorage,
 * are folded in once.
 */
const today = () => rotationDate();
let found = new Set<number>(ticksFor(userData().collectibles, today()));
function saveTicks(next: Set<number>) {
  updateUserData((d) => setTicks(d.collectibles, today(), [...next]));
}
{
  const old = store.get<number[]>(OLD_TICKS(today()), []);
  if (old.length) {
    found = new Set([...found, ...old]);
    saveTicks(found);
    try { localStorage.removeItem(OLD_TICKS(today())); } catch { /* nothing */ }
  }
}

const altarNo = (p: MapPlace) => Number(p.id.slice('altar-'.length));
const eventOn = (day = rotationDate()) => day >= RED_MOON.start && day <= RED_MOON.end;

let map: maplibregl.Map | null = null;
/** Built-in positions until the owner's corrections arrive. */
let current = applyOverrides(emptyOverrides());
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
    p.kind === 'altar' ? altarPhotos(altarNo(p)) : null,
    target ? el('p', { class: 'map-pop-loot' }, [t('mapTodayLoot'), ' ', el('b', { class: lootTone(target) }, [lootName(target)])]) : null,
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

const shotLabel = (kind: ShotKind) => t(kind === 'scene' ? 'mapShotScene' : kind === 'map' ? 'mapShotMap' : 'mapShotEntrance');

/** Every altar screenshot in order, for stepping through in the lightbox. */
function allShots(): (LightboxItem & { n: number; kind: ShotKind })[] {
  const zh = lang() === 'zh-tw';
  return ALTARS.flatMap((p) => SHOT_KINDS.flatMap((kind) => {
    const n = altarNo(p);
    const src = altarShot(n, kind);
    if (!src) return [];
    const where = p.where ? (zh ? p.where.zh : p.where.en) : '';
    return [{ n, kind, src, caption: `#${n} ${p.district} · ${shotLabel(kind)} — ${where}` }];
  }));
}

function altarPhotos(n: number) {
  const shots = SHOT_KINDS
    .map((kind) => ({ kind, url: altarShot(n, kind) }))
    .filter((x): x is { kind: ShotKind; url: string } => !!x.url);
  if (!shots.length) return null;
  return el('div', { class: `map-pop-shots n${shots.length}` }, shots.map(({ kind, url }) => el('button', {
    type: 'button', class: 'map-pop-shot', title: shotLabel(kind),
    onclick: () => {
      const all = allShots();
      openLightbox(all, all.findIndex((x) => x.n === n && x.kind === kind));
    },
  }, [el('img', { src: url, alt: `${shotLabel(kind)} #${n}`, loading: 'lazy', width: 118, height: 66 })])));
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

function addDistricts() {
  if (!map) return;
  addAreaLayers(map, current.districts, current.area);
  showDistricts();
}

function showDistricts() {
  if (!map?.getSource('districts')) return;
  for (const id of DISTRICT_LAYERS) map.setLayoutProperty(id, 'visibility', layers.district ? 'visible' : 'none');
}

function placeMarkers() {
  if (!map) return;
  for (const { marker } of markers.values()) marker.remove();
  markers.clear();
  for (const p of [...current.strongholds, ...current.missions, ...current.altars]) {
    if (!layers[p.kind] || (p.kind === 'altar' && !eventOn())) continue;
    const node = pinNode(p);
    const popup = new maplibregl.Popup({ offset: 14, maxWidth: '260px' });
    popup.on('open', () => popup.setDOMContent(popupContent(p)));
    const marker = new maplibregl.Marker({ element: node }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
    markers.set(p.id, { place: p, marker, node });
  }
}

function toggleAltar(n: number) {
  const next = new Set(found);
  if (next.has(n)) next.delete(n); else next.add(n);
  found = next;
  saveTicks(next);
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
let stopTicks: (() => void) | null = null;

function renderPanel(panel: HTMLElement) {
  const day = rotationDate();
  // A new reset since the ticks were loaded: start the day clean.
  found = new Set(ticksFor(userData().collectibles, day));

  const toggle = (kind: Layer, count: number, disabled = false) => el('label', { class: `map-toggle kind-${kind}` }, [
    el('input', {
      type: 'checkbox', checked: layers[kind] && !disabled, disabled,
      onchange: (e: Event) => {
        layers[kind] = (e.target as HTMLInputElement).checked;
        store.set(LAYERS_KEY, layers);
        if (kind === 'district') showDistricts(); else placeMarkers();
      },
    }),
    el('span', { class: 'map-swatch' }),
    `${t(`mapLayer_${kind}` as const)} (${count})`,
  ]);

  const missionsToday = loot?.missions ?? [];
  const onMap = (name: string) => current.missions.find((p) => looseKey(p.en) === looseKey(name));

  panel.replaceChildren(
    el('section', { class: 'map-card' }, [
      el('h2', { class: 'col-heading' }, [t('mapLayers')]),
      toggle('district', DISTRICTS.length),
      toggle('mission', current.missions.length),
      toggle('stronghold', current.strongholds.length),
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
            onclick: () => { found = new Set(); saveTicks(found); placeMarkers(); onChange(); },
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
            el('b', { class: lootTone(m.loot) }, [lootName(m.loot)]),
          ]);
        }))
        : el('p', { class: 'map-note' }, [t(loot ? 'mapLootNone' : 'detailLoading')]),
    ]),
    el('p', { class: 'map-note' }, [t('mapApproxAll')]),
    el('p', { class: 'map-note' }, [el('a', { href: `${import.meta.env.BASE_URL}map-edit/` }, [t('mapEditLink')])]),
  );
}

export function renderMapPage(root: HTMLElement) {
  let panel = root.querySelector<HTMLElement>('.map-panel');
  if (!panel) {
    panel = el('aside', { class: 'map-panel' });
    const canvas = el('div', { class: 'map-canvas' });
    root.replaceChildren(canvas, panel);
    map = createMap(canvas);
    void loadMapOverrides().then((ov) => {
      current = applyOverrides(ov);
      if (map?.getSource('districts')) setAreaData(map, current.districts, current.area);
      placeMarkers();
    });
    map.on('load', () => { addDistricts(); placeMarkers(); });
    void loadLoot().then((snap) => { loot = snap; placeMarkers(); renderPanel(panel!); });
  }
  const p = panel;
  onChange = () => renderPanel(p);
  if (!stopTicks) {
    // Ticks made in another browser (or merged in on sign-in) arrive here.
    stopTicks = onUserData(() => {
      const now = ticksFor(userData().collectibles, today());
      if (now.length === found.size && now.every((x) => found.has(x))) return;
      found = new Set(now);
      for (const m of markers.values()) if (m.place.kind === 'altar') m.node.classList.toggle('done', found.has(altarNo(m.place)));
      onChange();
    });
  }
  renderPanel(p);
  if (map?.loaded()) placeMarkers();
}
