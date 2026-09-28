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
import { renderSpecPanel } from './ui/spec-panel.ts';
import { renderSkillPanel } from './ui/skill-panel.ts';
import { reset, subscribe } from './ui/store.ts';
import { el } from './ui/dom.ts';
import { loadOverrides } from './i18n/overrides.ts';

const data = raw as unknown as GameData;

const app = document.getElementById('app')!;
const header = el('header', { class: 'app-header' });
const banner = el('p', { class: 'data-banner' });
const recommended = el('section', { class: 'recommended' });
const layout = el('div', { class: 'layout' });
const gearCol = el('div', { class: 'gear-col' });
const weaponCol = el('div', { class: 'gear-col weapon-col' });
const buildCol = el('div', { class: 'build-col' });
const skillCol = el('div', { class: 'skill-col' });
const specCol = el('div', { class: 'spec-col' });
const watch = el('div', { class: 'watch-col' });
const summaryCol = el('aside', { class: 'summary-col' });
// The summary panel clears whatever it renders into, so the damage panel gets
// its own container rather than sharing one and being wiped on every keystroke.
const damage = el('div', { class: 'damage-col' });
const summaryInner = el('div', { class: 'summary-inner' });

summaryCol.append(damage, summaryInner);

// 遊戲內的排法 / Laid out the way the game does: watch across the top, then the
// three weapons, then the six gear slots in pairs.
const weaponHeading = el('h2', { class: 'col-heading' }, []);
const gearHeading = el('h2', { class: 'col-heading' }, []);
buildCol.append(weaponHeading, weaponCol, gearHeading, gearCol, skillCol, specCol);
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
  weaponHeading.replaceChildren(t('weapons'));
  gearHeading.replaceChildren(t('gear'));
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
  renderSpecPanel(specCol, data);
  renderSkillPanel(skillCol, data);
  renderDamagePanel(damage, data);
  renderSummaryPanel(summaryInner, data);
  renderRecommendedPanel(recommended, data);
}

subscribe((scope) => {
  // The watch panel is deliberately not re-rendered on 'summary': that scope
  // fires on every keystroke inside it, and replacing the input would drop the
  // caret. Its own state is already what the player just typed.
  if (scope === 'gear') { renderGearPanel(gearCol, data); renderWeaponPanel(weaponCol, data); renderWatchPanel(watch, data); renderSpecPanel(specCol, data); }
  // Skills re-render on both: a yellow core changes the tier, and picking one
  // skill greys its parent out of the other slot. Only selects live there, so
  // nothing loses a caret.
  renderSkillPanel(skillCol, data);
  renderDamagePanel(damage, data);
  renderSummaryPanel(summaryInner, data);
});

setLang(lang() as Lang);
renderAll();

// 線上譯名 / Names edited in the sheet arrive after the page is already up:
// the fetch crosses to Google and is not worth a blank screen. If it lands,
// re-render; if it does not, the built-in names are already what is showing.
void loadOverrides().then((result) => {
  if (result) renderAll();
});
