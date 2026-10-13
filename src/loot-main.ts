/**
 * 每日戰利品頁進入點 / Entry point for the standalone daily loot page.
 *
 * Its own page so it loads without the build planner's dataset: nothing here
 * imports `game-data.json`, which is the bulk of the planner's bundle.
 */
import './styles/main.scss';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { loadOverrides } from './i18n/overrides.ts';
import { LOOT_PAGE } from './model/loot.ts';
import { el } from './ui/dom.ts';
import { renderLootPanel } from './ui/loot-panel.ts';
import { renderHeader } from './ui/site-header.ts';
import { onUserData } from './cloud/user-data.ts';
import { startCloud } from './cloud/sync.ts';

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const root = el('div', { class: 'loot' });
app.append(header, banner, root);

function renderAll() {
  renderHeader(header, 'loot', [
    el('button', {
      class: 'ghost',
      onclick: () => { setLang(lang() === 'zh-tw' ? 'en' : 'zh-tw'); renderAll(); },
    }, [lang() === 'zh-tw' ? 'EN' : '中文']),
  ]);
  banner.replaceChildren(
    el('span', {}, [t('lootBanner')]),
    el('a', { href: LOOT_PAGE, target: '_blank', rel: 'noopener' }, ['Raigulus']),
  );
  document.title = `${t('navLoot')} · ${t('title')}`;
  renderLootPanel(root);
}

setLang(lang() as Lang);
renderAll();

// The only thing here that another browser can change is the language.
onUserData((d, source) => {
  if (source === 'cloud' && d.lang && d.lang !== lang()) { setLang(d.lang, { persist: false }); renderAll(); }
});
startCloud();

// Mission names come from the sheet (kind `mission`), so re-render if it lands.
void loadOverrides().then((result) => {
  if (result) renderAll();
});
