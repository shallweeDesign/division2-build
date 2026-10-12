/** 收集品頁進入點 / Entry point for the collectibles page. */
import './styles/main.scss';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { el } from './ui/dom.ts';
import { renderCollectiblesPanel } from './ui/collectibles-panel.ts';
import { renderHeader } from './ui/site-header.ts';

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const root = el('div', { class: 'collect' });
app.append(header, banner, root);

function renderAll() {
  renderHeader(header, 'collectibles', [
    el('button', {
      class: 'ghost',
      onclick: () => { setLang(lang() === 'zh-tw' ? 'en' : 'zh-tw'); renderAll(); },
    }, [lang() === 'zh-tw' ? 'EN' : '中文']),
  ]);
  banner.replaceChildren(el('span', {}, [t('collectBanner')]));
  document.title = `${t('navCollectibles')} · ${t('title')}`;
  renderCollectiblesPanel(root);
}

window.addEventListener('hashchange', () => { renderCollectiblesPanel(root); window.scrollTo(0, 0); });

setLang(lang() as Lang);
renderAll();
