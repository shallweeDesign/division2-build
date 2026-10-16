/**
 * 地圖底圖 / What the map page and the position editor share: the dark base
 * map, the bounds, and the district and game-area layers.
 *
 * Base map: OpenStreetMap's standard raster tiles, inverted, desaturated and
 * dimmed in the raster layer's paint into a dark tactical look. They are
 * ~40 KB a tile; OpenFreeMap's vector tiles over central D.C. were 270-510 KB
 * each and took 10 s and more to fill the first view.
 */
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 runs its tile work in a module worker that imports a shared
// chunk; Vite has to bundle that worker itself, or the URL it ends up with
// points at a file that is not there and the base map stays black.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { MAP_BOUNDS, MAP_CENTER } from '../data/map/places.ts';
import type { District } from '../data/map/places.ts';

maplibregl.setWorkerUrl(workerUrl);

export { maplibregl };
export type Ring = [number, number][];

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  // Only the district names need glyphs; OpenFreeMap serves them without a key.
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0b0d10' } },
    {
      id: 'osm', type: 'raster', source: 'osm',
      // brightness-min above max inverts; 0.5 → 0 keeps it near black.
      paint: { 'raster-saturation': -1, 'raster-brightness-min': 0.5, 'raster-brightness-max': 0, 'raster-contrast': 0.15 },
    },
  ],
};

export function createMap(container: HTMLElement) {
  const map = new maplibregl.Map({
    container, style: STYLE, center: MAP_CENTER, zoom: 13.4, minZoom: 12, maxZoom: 18, maxBounds: MAP_BOUNDS,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  return map;
}

const centre = (ring: Ring): [number, number] => {
  const pts = ring.slice(0, -1);
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
};

const districtsGeo = (districts: District[]) => ({
  type: 'FeatureCollection' as const,
  features: districts.map((d) => ({ type: 'Feature' as const, properties: { name: d.name }, geometry: { type: 'Polygon' as const, coordinates: [d.ring] } })),
});
const namesGeo = (districts: District[]) => ({
  type: 'FeatureCollection' as const,
  features: districts.map((d) => ({ type: 'Feature' as const, properties: { name: d.name }, geometry: { type: 'Point' as const, coordinates: centre(d.ring) } })),
});
// Everything outside the game's D.C.: the world with the game area cut out.
const outsideGeo = (area: Ring) => ({
  type: 'Feature' as const, properties: {},
  geometry: { type: 'Polygon' as const, coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], area] },
});

/** The layers that the district toggle shows and hides (the mask stays). */
export const DISTRICT_LAYERS = ['district-fill', 'district-line', 'district-label'];

/** 分區與遊戲範圍 / District outlines, names, and the mask outside the game area. */
export function addAreaLayers(map: maplibregl.Map, districts: District[], area: Ring) {
  if (map.getSource('districts')) { setAreaData(map, districts, area); return; }
  map.addSource('districts', { type: 'geojson', data: districtsGeo(districts) });
  map.addSource('district-names', { type: 'geojson', data: namesGeo(districts) });
  map.addSource('outside', { type: 'geojson', data: outsideGeo(area) });
  map.addLayer({ id: 'outside-mask', type: 'fill', source: 'outside', paint: { 'fill-color': '#050607', 'fill-opacity': 0.82 } });
  map.addLayer({ id: 'outside-edge', type: 'line', source: 'outside', paint: { 'line-color': '#ff6a13', 'line-opacity': 0.5, 'line-width': 1.5 } });
  map.addLayer({ id: 'district-fill', type: 'fill', source: 'districts', paint: { 'fill-color': '#ff6a13', 'fill-opacity': 0.02 } });
  map.addLayer({
    id: 'district-line', type: 'line', source: 'districts',
    paint: { 'line-color': '#e8e2d6', 'line-opacity': 0.55, 'line-width': 1.2, 'line-dasharray': [3, 2] },
  });
  map.addLayer({
    id: 'district-label', type: 'symbol', source: 'district-names',
    layout: {
      'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 12,
      'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-allow-overlap': false,
    },
    paint: { 'text-color': '#ffb27a', 'text-opacity': 0.75, 'text-halo-color': '#000', 'text-halo-width': 1.2 },
  });
}

export function setAreaData(map: maplibregl.Map, districts: District[], area: Ring) {
  (map.getSource('districts') as maplibregl.GeoJSONSource | undefined)?.setData(districtsGeo(districts));
  (map.getSource('district-names') as maplibregl.GeoJSONSource | undefined)?.setData(namesGeo(districts));
  (map.getSource('outside') as maplibregl.GeoJSONSource | undefined)?.setData(outsideGeo(area));
}
