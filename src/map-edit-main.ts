/** 地圖位置編輯頁進入點 / Entry point for the map position editor. */
import './styles/main.scss';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { el } from './ui/dom.ts';
import { renderMapEditor } from './ui/map-editor.ts';
import { renderHeader } from './ui/site-header.ts';
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
  banner.replaceChildren(el('span', {}, [t('mapEditBanner')]));
  document.title = `${t('mapEditTitle')} · ${t('title')}`;
  renderMapEditor(root);
}

setLang(lang() as Lang);
renderAll();
startCloud();
