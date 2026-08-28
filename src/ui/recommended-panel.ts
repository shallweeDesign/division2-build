/** 推薦套裝 / A gallery of starting-point builds the player can load. */
import type { GameData } from '../model/types.ts';
import { RECOMMENDED } from '../data/recommended.ts';
import type { RecommendedBuild } from '../data/recommended.ts';
import { resolveRecommended } from '../model/calc/recommend.ts';
import { lang, t, tFocus, tSet } from '../i18n/index.ts';
import { load } from './store.ts';
import { clear, el } from './dom.ts';

function card(data: GameData, template: RecommendedBuild) {
  const composition = template.sets
    .map((s) => `${tSet(s.name)} ×${s.pieces}`)
    .join(' + ');

  return el('article', { class: `rec-card focus-${template.focus}` }, [
    el('header', {}, [
      el('h3', {}, [template.name[lang()]]),
      el('span', { class: `pill focus-${template.focus}` }, [tFocus(template.focus)]),
    ]),
    el('p', { class: 'rec-sets' }, [composition]),
    el('p', { class: 'rec-summary' }, [template.summary[lang()]]),
    el('button', {
      class: 'ghost',
      onclick: () => {
        load(resolveRecommended(data, template).build);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    }, [t('apply')]),
  ]);
}

export function renderRecommendedPanel(root: HTMLElement, data: GameData) {
  clear(root);
  root.append(
    el('div', { class: 'rec-head' }, [
      el('h2', {}, [t('recommended')]),
      el('p', { class: 'muted' }, [t('recommendedNote')]),
    ]),
    el('div', { class: 'rec-grid' }, RECOMMENDED.map((r) => card(data, r))),
  );
}
