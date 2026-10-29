/** 地圖頁進入點 / Entry point for the D.C. map page. */
import './styles/main.scss';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { loadOverrides } from './i18n/overrides.ts';
import { el } from './ui/dom.ts';
import { renderMapPage } from './ui/map-view.ts';
import { renderHeader } from './ui/site-header.ts';
import { onUserData } from './cloud/user-data.ts';
import { startCloud } from './cloud/sync.ts';

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const root = el('div', { class: 'map-page' });
app.append(header, banner, root);

function renderAll() {
  renderHeader(header, 'map', [
    el('button', {
      class: 'ghost',
      onclick: () => { setLang(lang() === 'zh-tw' ? 'en' : 'zh-tw'); renderAll(); },
    }, [lang() === 'zh-tw' ? 'EN' : '中文']),
  ]);
  banner.replaceChildren(el('span', {}, [t('mapBanner')]));
  renderMapPage(root);
}

setLang(lang() as Lang);
renderAll();

onUserData((d, source) => {
  if (source === 'cloud' && d.lang && d.lang !== lang()) { setLang(d.lang, { persist: false }); renderAll(); }
});
startCloud();

// Mission and loot names can come from the sheet, so re-render if it lands.
void loadOverrides().then((result) => {
  if (result) renderAll();
});
