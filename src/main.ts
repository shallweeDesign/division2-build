/** 進入點 / Entry point: wire the panels to the store and render. */
import './styles/main.scss';
import type { GameData } from './model/types.ts';
import raw from './data/generated/game-data.json';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { renderGearPanel } from './ui/gear-panel.ts';
import { renderSummaryPanel } from './ui/summary-panel.ts';
import { renderRecommendedPanel } from './ui/recommended-panel.ts';
import { reset, subscribe } from './ui/store.ts';
import { el } from './ui/dom.ts';

const data = raw as unknown as GameData;

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const recommended = el('section', { class: 'recommended' });
const layout = el('div', { class: 'layout' });
const gearCol = el('div', { class: 'gear-col' });
const summaryCol = el('aside', { class: 'summary-col' });
layout.append(gearCol, summaryCol);
app.append(header, banner, layout, recommended);

function renderChrome() {
  header.replaceChildren(
    el('h1', {}, [t('title')]),
    el('div', { class: 'header-actions' }, [
      el('button', { class: 'ghost', onclick: () => reset() }, [t('clear')]),
      el('button', {
        class: 'ghost',
        onclick: () => { setLang(lang() === 'zh-tw' ? 'en' : 'zh-tw'); renderAll(); },
      }, [lang() === 'zh-tw' ? 'EN' : '中文']),
    ]),
  );
  banner.replaceChildren(
    el('span', {}, [t('dataBanner')]),
    el('a', { href: data.meta.sourceUrl, target: '_blank', rel: 'noopener' }, [data.meta.source]),
  );
  document.title = t('title');
}

function renderAll() {
  renderChrome();
  renderGearPanel(gearCol, data);
  renderSummaryPanel(summaryCol, data);
  renderRecommendedPanel(recommended, data);
}

subscribe((scope) => {
  if (scope === 'gear') renderGearPanel(gearCol, data);
  renderSummaryPanel(summaryCol, data);
});

setLang(lang() as Lang);
renderAll();
