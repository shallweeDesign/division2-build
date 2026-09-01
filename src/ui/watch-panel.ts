/**
 * SHD 手錶面板 / Watch bonuses, entered as the percentages the game shows.
 *
 * Typing here fires the `summary` scope only. The gear column has nothing to
 * rebuild, and re-rendering it would pull focus out of the field mid-number.
 */
import type { GameData } from '../model/types.ts';
import type { WatchNode } from '../model/watch.ts';
import { NODE_CATEGORY, WATCH_NODES, WATCH_STAT_IDS, watchStatsOf } from '../model/watch.ts';
import { emptyWatch } from '../model/build.ts';
import { t, tStat } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el } from './dom.ts';

const NODE_LABEL: Record<WatchNode, 'nodeOffensive' | 'nodeDefensive' | 'nodeHandling' | 'nodeUtility'> = {
  offensive: 'nodeOffensive',
  defensive: 'nodeDefensive',
  handling: 'nodeHandling',
  utility: 'nodeUtility',
};

export function renderWatchPanel(root: HTMLElement, data: GameData) {
  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const name = (id: string) => tStat(id, statName.get(id) ?? id);
  const watch = build().watch;
  // Read through the store rather than the captured object: clearing replaces
  // `watch` wholesale, which would leave this closure inspecting a dead copy.
  const anySet = () => WATCH_STAT_IDS.some((id) => (build().watch[id] ?? 0) !== 0);

  clear(root);

  // Typing only fires the 'summary' scope, so this panel is not re-rendered
  // while the player is in it — which is what keeps the caret. The clear button
  // therefore has to be shown and hidden by hand rather than by re-render.
  const clearBtn = el('button', {
    class: 'ghost small',
    hidden: !anySet(),
    onclick: () => {
      update('summary', (b) => { b.watch = emptyWatch(); });
      for (const i of root.querySelectorAll<HTMLInputElement>('.watch-input')) i.value = '';
      clearBtn.hidden = true;
    },
  }, [t('watchClear')]);

  const field = (statId: string) => {
    const input = el('input', {
      type: 'number',
      min: 0,
      step: '0.1',
      inputmode: 'decimal',
      class: 'watch-input',
      value: watch[statId] ? String(watch[statId]) : '',
      placeholder: '0',
      'aria-label': name(statId),
    });
    input.addEventListener('input', () => {
      // An unparseable or negative entry counts as nothing rather than as NaN,
      // which would otherwise poison every total downstream.
      const n = Number.parseFloat(input.value);
      update('summary', (b) => { b.watch[statId] = Number.isFinite(n) && n > 0 ? n : 0; });
      clearBtn.hidden = !anySet();
    });
    return el('li', {}, [
      el('span', { class: 'watch-name' }, [name(statId)]),
      el('span', { class: 'watch-entry' }, [input, el('span', { class: 'watch-unit' }, ['%'])]),
    ]);
  };

  root.append(
    el('section', { class: 'panel watch' }, [
      el('div', { class: 'watch-head' }, [
        el('h2', {}, [t('watch')]),
        clearBtn,
      ]),
      el('p', { class: 'muted' }, [t('watchNote')]),
      // Full width, so the four nodes read as columns rather than a long list.
      el('div', { class: 'watch-nodes' }, WATCH_NODES.map((node) => {
        const cat = NODE_CATEGORY[node];
        return el('div', { class: `watch-node${cat ? ` cat-${cat}` : ''}` }, [
          el('h3', {}, [t(NODE_LABEL[node])]),
          el('ul', { class: 'watch-list' }, watchStatsOf(node).map((w) => field(w.statId))),
        ]);
      })),
    ]),
  );
}
