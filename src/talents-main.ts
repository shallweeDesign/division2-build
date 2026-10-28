/** 天賦頁進入點 / Entry point for the talents page. */
import './styles/main.scss';
import type { GameData } from './model/types.ts';
import raw from './data/generated/game-data.json';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { el } from './ui/dom.ts';
import { renderTalentsPanel } from './ui/talents-panel.ts';
import { renderHeader } from './ui/site-header.ts';
import { loadOverrides } from './i18n/overrides.ts';
import { onUserData } from './cloud/user-data.ts';
import { startCloud } from './cloud/sync.ts';

const data = raw as unknown as GameData;

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const root = el('div', { class: 'talents' });
app.append(header, banner, root);

function renderAll() {
  renderHeader(header, 'talents', [
    el('button', {
      class: 'ghost',
      onclick: () => { setLang(lang() === 'zh-tw' ? 'en' : 'zh-tw'); renderAll(); },
    }, [lang() === 'zh-tw' ? 'EN' : '中文']),
  ]);
  banner.replaceChildren(el('span', {}, [t('dataBanner')]));
  document.title = `${t('navTalents')} · ${t('title')}`;
  renderTalentsPanel(root, data);
}

window.addEventListener('hashchange', () => { renderTalentsPanel(root, data); window.scrollTo(0, 0); });

setLang(lang() as Lang);
renderAll();

// The sheet's names arrive after first paint, as on the planner.
void loadOverrides().then((result) => { if (result) renderAll(); });

onUserData((d, source) => {
  if (source !== 'cloud') return;
  if (d.lang && d.lang !== lang()) setLang(d.lang, { persist: false });
  renderAll();
});
startCloud();
