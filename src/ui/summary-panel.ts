/** 屬性總覽 / Stats, active set bonuses and warnings for the current build. */
import type { GameData } from '../model/types.ts';
import { computeBuild } from '../model/calc/index.ts';
import { MAX_PIECES } from '../model/calc/constants.ts';
import { t, tStat } from '../i18n/index.ts';
import { build } from './store.ts';
import { clear, el } from './dom.ts';

const round = (n: number) => Math.round(n * 100) / 100;

export function renderSummaryPanel(root: HTMLElement, data: GameData) {
  const { stats, sets, warnings, coreCounts } = computeBuild(data, build());
  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const name = (id: string) => tStat(id, statName.get(id) ?? id);

  clear(root);

  // Cores — the three-way red/blue/yellow split every build is described by.
  const coreEntries = Object.entries(coreCounts).sort((a, b) => b[1] - a[1]);
  root.append(
    el('section', { class: 'panel' }, [
      el('h2', {}, [t('cores')]),
      coreEntries.length
        ? el('ul', { class: 'core-list' }, coreEntries.map(([id, n]) =>
            el('li', {}, [el('span', {}, [name(id)]), el('strong', {}, [String(n)])])))
        : el('p', { class: 'muted' }, [t('noCores')]),
    ]),
  );

  // Set bonuses.
  root.append(
    el('section', { class: 'panel' }, [
      el('h2', {}, [t('setBonuses')]),
      sets.length
        ? el('ul', { class: 'set-list' }, sets.map((s) =>
            el('li', {}, [
              el('div', { class: 'set-head' }, [
                el('strong', {}, [s.set.name]),
                el('span', { class: `pill ${s.set.kind}` }, [`${s.pieces}/${MAX_PIECES[s.set.kind]} ${t('pieces')}`]),
              ]),
              el('ul', { class: 'tier-list' }, s.active.flatMap((tier) =>
                tier.entries.map((e) =>
                  el('li', {}, [
                    el('span', { class: 'tier-pips' }, [`${tier.pieces}`]),
                    e.kind === 'stat'
                      ? `${name(e.statId)} +${e.value.n}${e.value.percent ? '%' : ''}`
                      : el('em', {}, [e.name]),
                  ])))),
              s.next
                ? el('p', { class: 'muted next' }, [
                    t('needMore').replace('{n}', String(s.next.missing)).replace('{p}', String(s.next.pieces)),
                  ])
                : null,
            ])))
        : el('p', { class: 'muted' }, [t('noStats')]),
    ]),
  );

  // Totalled stats, each expandable to show where the value came from.
  root.append(
    el('section', { class: 'panel' }, [
      el('h2', {}, [t('stats')]),
      stats.length
        ? el('table', { class: 'stat-table' }, [
            el('tbody', {}, stats.map((s) =>
              el('tr', { class: s.capped ? 'is-capped' : '' }, [
                el('th', {}, [name(s.statId)]),
                el('td', { title: s.contributions.map((c) => `${c.source}: ${round(c.value)}`).join('\n') }, [
                  `${round(s.value)}${s.percent ? '%' : ''}`,
                  s.capped ? el('span', { class: 'cap-flag' }, [` ${t('capped')} (${round(s.raw)})`]) : null,
                ]),
              ]))),
          ])
        : el('p', { class: 'muted' }, [t('noStats')]),
    ]),
  );

  if (warnings.length) {
    root.append(
      el('section', { class: 'panel panel-warn' }, [
        el('h2', {}, [t('warnings')]),
        el('ul', {}, warnings.map((w) => el('li', {}, [w]))),
      ]),
    );
  }
}
