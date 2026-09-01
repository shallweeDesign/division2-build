import { defineConfig } from 'vite';

/**
 * 部署路徑 / The app is served from a sub-path of the Pages site, not the root:
 *   https://shallweedesign.github.io/lab/division2_builder/
 * Without `base` every hashed asset resolves against `/` and 404s once it is
 * out of the dev server. `npm run dev` keeps the root so local URLs stay short.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lab/division2_builder/' : '/',
}));
