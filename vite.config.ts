import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * 部署路徑 / The app is served from a sub-path of the Pages site, not the root:
 *   https://shallweedesign.github.io/lab/division2_builder/
 * Without `base` every hashed asset resolves against `/` and 404s once it is
 * out of the dev server. `npm run dev` keeps the root so local URLs stay short.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lab/division2_builder/' : '/',
  // 各頁獨立 / One bundle per page: the loot, collectibles and map pages have no use
  // for the planner's dataset and should not download it.
  // The map's worker is an ES module (MapLibre 6).
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        loot: fileURLToPath(new URL('loot/index.html', import.meta.url)),
        collectibles: fileURLToPath(new URL('collectibles/index.html', import.meta.url)),
        map: fileURLToPath(new URL('map/index.html', import.meta.url)),
        mapEdit: fileURLToPath(new URL('map-edit/index.html', import.meta.url)),
      },
    },
  },
}));
