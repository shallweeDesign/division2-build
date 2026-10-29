/**
 * 搜尋引擎 / What search engines and link previews read.
 *
 * Every page renders in the browser, so a crawler that does not run scripts
 * sees an empty `#app`. This plugin gives each page, at build time, the parts
 * that do not need the app: a description, a canonical URL, Open Graph and
 * Twitter tags for link previews, a short `<noscript>` summary with links to
 * the other pages, and — for the planner — structured data. It also writes
 * `sitemap.xml` from the same table, so a new page is listed by adding one row.
 *
 * Descriptions lead with Chinese (the site's language) and follow with English,
 * since people search for it both ways.
 */
import type { Plugin } from 'vite';

export const SITE = 'https://shallweedesign.github.io/lab/division2_builder/';

interface Page { path: string; title: string; description: string; summary: string }

/** 各頁 / Keyed by the page's folder; '' is the planner. map-edit is left out on purpose (noindex). */
export const PAGES: Page[] = [
  {
    path: '',
    title: '全境封鎖2 配裝工具 / The Division 2 Build Planner',
    description: '全境封鎖2（The Division 2）繁體中文配裝模擬器：挑選武器、裝備、品牌與套裝、天賦和技能，即時計算屬性。Free The Division 2 build planner in Traditional Chinese and English.',
    summary: '挑選武器、裝備、品牌與套裝、天賦和技能，即時計算屬性，可儲存配裝。',
  },
  {
    path: 'talents/',
    title: '天賦一覽 · 全境封鎖2 / The Division 2 Talents',
    description: '全境封鎖2 全部天賦一覽：武器天賦、裝備與套裝天賦、技能專精天賦，中英對照、可搜尋、可挑選比較。Every The Division 2 talent — weapon, gear set and specialization — in Chinese and English.',
    summary: '武器天賦、裝備與套裝天賦、技能專精天賦，中英對照、可搜尋。',
  },
  {
    path: 'loot/',
    title: '每日戰利品 · 全境封鎖2 / The Division 2 Daily Loot',
    description: '全境封鎖2 今日目標戰利品：各任務與區域今天掉落的裝備部位、品牌與套裝，以及商人補給箱。The Division 2 targeted loot of the day, in Chinese and English.',
    summary: '各任務與區域今天的目標戰利品與補給箱。',
  },
  {
    path: 'map/',
    title: '地圖 · 全境封鎖2 / The Division 2 Map',
    description: '全境封鎖2 華盛頓特區互動地圖：任務位置、今日目標戰利品、血月祭壇。Interactive The Division 2 map of Washington, D.C. with missions, targeted loot and Red Moon altars.',
    summary: '華盛頓特區互動地圖：任務位置、今日目標戰利品、血月祭壇。',
  },
  {
    path: 'collectibles/',
    title: '收集品 · 全境封鎖2 / The Division 2 Collectibles',
    description: '全境封鎖2 收集品清單：河狸等收集品與突襲（Raid）收集品，可勾選進度。The Division 2 collectibles checklist, including beavers and raids.',
    summary: '河狸等收集品與突襲收集品清單，可勾選進度。',
  },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** 由 Vite 給的路徑找頁 / '/talents/index.html' → the talents row. */
const pageFor = (htmlPath: string) => {
  const folder = htmlPath.replace(/^\//, '').replace(/index\.html$/, '');
  return PAGES.find((p) => p.path === folder);
};

function headTags(page: Page): string {
  const url = SITE + page.path;
  const tags = [
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="theme-color" content="#0d0f12" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="全境封鎖2 配裝工具 / The Division 2 Build Planner" />`,
    `<meta property="og:locale" content="zh_TW" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}og.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (page.path === '') {
    tags.push(`<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '全境封鎖2 配裝工具',
      alternateName: 'The Division 2 Build Planner',
      url,
      description: page.description,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      inLanguage: ['zh-Hant', 'en'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    })}</script>`);
  }
  return tags.map((t) => `    ${t}`).join('\n');
}

/** 無腳本時 / What a crawler without scripts, or a reader with them off, sees. */
function noscript(page: Page): string {
  const links = PAGES.filter((p) => p !== page)
    .map((p) => `<li><a href="${SITE}${p.path}">${esc(p.title)}</a></li>`).join('');
  return `    <noscript><h1>${esc(page.title)}</h1><p>${esc(page.summary)}</p><p>需要啟用 JavaScript / Requires JavaScript.</p><ul>${links}</ul></noscript>`;
}

export function seo(): Plugin {
  return {
    name: 'd2-seo',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const page = pageFor(ctx.path);
      if (!page) return html;
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>\n${headTags(page)}`)
        .replace('<div id="app"></div>', `<div id="app"></div>\n${noscript(page)}`);
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = PAGES.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}
