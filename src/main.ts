/** 進入點 / Entry point: wire the panels to the store and render. */
import './styles/main.scss';
import type { GameData } from './model/types.ts';
import raw from './data/generated/game-data.json';
import { lang, setLang, t } from './i18n/index.ts';
import type { Lang } from './i18n/index.ts';
import { renderGearPanel } from './ui/gear-panel.ts';
import { renderSummaryPanel } from './ui/summary-panel.ts';
import { renderRecommendedPanel } from './ui/recommended-panel.ts';
import { renderWatchPanel } from './ui/watch-panel.ts';
import { renderWeaponPanel } from './ui/weapon-panel.ts';
import { renderDamagePanel } from './ui/damage-panel.ts';
import { reset, subscribe } from './ui/store.ts';
import { el } from './ui/dom.ts';

const data = raw as unknown as GameData;

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const recommended = el('section', { class: 'recommended' });
const layout = el('div', { class: 'layout' });
const gearCol = el('div', { class: 'gear-col' });
const weaponCol = el('div', { class: 'gear-col weapon-col' });
const buildCol = el('div', { class: 'build-col' });
const watch = el('div', { class: 'watch-col' });
const summaryCol = el('aside', { class: 'summary-col' });
// The summary panel clears whatever it renders into, so the damage panel gets
// its own container rather than sharing one and being wiped on every keystroke.
const damage = el('div', { class: 'damage-col' });
const summaryInner = el('div', { class: 'summary-inner' });
buildCol.append(gearCol, el('h2', { class: 'col-heading' }, [t('weapons')]), weaponCol);
summaryCol.append(damage, summaryInner);
layout.append(buildCol, summaryCol);
app.append(header, banner, watch, layout, recommended);

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
  renderWeaponPanel(weaponCol, data);
  renderWatchPanel(watch, data);
  renderDamagePanel(damage, data);
  renderSummaryPanel(summaryInner, data);
  renderRecommendedPanel(recommended, data);
}

subscribe((scope) => {
  // The watch panel is deliberately not re-rendered on 'summary': that scope
  // fires on every keystroke inside it, and replacing the input would drop the
  // caret. Its own state is already what the player just typed.
  if (scope === 'gear') { renderGearPanel(gearCol, data); renderWeaponPanel(weaponCol, data); renderWatchPanel(watch, data); }
  renderDamagePanel(damage, data);
  renderSummaryPanel(summaryInner, data);
});

setLang(lang() as Lang);
renderAll();
