/** 每日戰利品頁 / The daily loot page: today's rotation, read live. */
import { lang, t } from '../i18n/index.ts';
import { cacheTypeZh, lootZh, missionZh } from '../i18n/loot.ts';
import { resolveLoot } from '../model/loot-vocab.ts';
import { LOOT_PAGE, isStale, loadLoot, localClock, localDate, nextReset } from '../model/loot.ts';
import type { LootSnapshot } from '../model/loot.ts';
import { el } from './dom.ts';
import { openLootDetail, preloadLootData } from './loot-detail.ts';

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

/**
 * 雙語名稱 / In Chinese, the Chinese name leads with the English beneath it —
 * players search guides and party chat in English. Without a Chinese name, or
 * in English, it is the English alone.
 */
function name(en: string, zh: (s: string) => string | undefined) {
  const local = lang() === 'zh-tw' ? zh(en) : undefined;
  // "5.11 Tactical" keeps its Latin name in Chinese; once is enough.
  if (!local || local === en) return el('span', { class: 'loot-name' }, [en]);
  return el('span', { class: 'loot-name' }, [local, el('small', {}, [en])]);
}

function sourceLink() {
  return el('a', { href: LOOT_PAGE, target: '_blank', rel: 'noopener' }, ['raigulus.github.io/division-2/loot']);
}

function meta(label: string, value: (Node | string)[]) {
  return el('div', { class: 'loot-meta-item' }, [el('dt', {}, [label]), el('dd', {}, value)]);
}

/**
 * 可點的戰利品 / A loot name that opens its detail popup: a brand or gear set
 * shows its pieces, a weapon class every weapon it can drop.
 */
function detailButton(source: string, label: Node, title: string, cls = '') {
  const preload = () => { void preloadLootData().catch(() => {}); };
  return el('button', {
    class: `loot-target-btn ${cls}`.trim(),
    type: 'button',
    'aria-haspopup': 'dialog',
    title: fill(t('detailOpen'), { n: title }),
    onclick: () => openLootDetail(source),
    onpointerenter: preload,
    onfocus: preload,
  }, [label, el('span', { class: 'loot-target-icon', 'aria-hidden': 'true' }, ['›'])]);
}

/**
 * 戰利品 / Any loot word, target or cache entry. What it opens follows from
 * what `resolveLoot` makes of it; a word it does not know is shown as it came,
 * tagged, and not offered as a button that could only fail.
 */
function lootItem(word: string, cls: string) {
  const label = name(word, lootZh);
  const ref = resolveLoot(word);
  // A mod category has a name but nothing in the dataset to list.
  if (ref.kind === 'mod') return el('span', { class: `loot-plain ${cls}` }, [label]);
  if (ref.kind === 'unknown') {
    return el('span', { class: `loot-unknown ${cls}`, title: t('lootUnknownHint') }, [
      label, el('span', { class: 'loot-unknown-tag' }, [t('lootUnknown')]),
    ]);
  }
  const title = lang() === 'zh-tw' ? lootZh(word) ?? word : word;
  return detailButton(word, label, title, cls);
}

function renderSnapshot(snap: LootSnapshot) {
  const now = new Date();
  const reset = nextReset(now);
  const resetLocal = localClock(reset);
  // Same `YYYY-MM-DD` form as the date beside it, on the reader's own clock.
  const next = [`${localDate(reset)} ${resetLocal}`];

  const notices: HTMLElement[] = [];
  if (isStale(snap, now)) {
    notices.push(el('p', { class: 'loot-notice' }, [fill(t('lootStale'), { t: resetLocal })]));
  }
  if (snap.status && snap.status !== 'ok') {
    notices.push(el('p', { class: 'loot-notice' }, [
      fill(t('lootNotOk'), { s: snap.status }), snap.note ? ` — ${snap.note}` : '',
    ]));
  }

  const missions = el('ol', { class: 'loot-missions' }, snap.missions.map((m) =>
    el('li', { class: 'loot-row' }, [
      el('span', { class: 'loot-mission' }, [name(m.mission, missionZh)]),
      lootItem(m.loot, 'loot-target'),
    ])));

  const caches = snap.vendorCaches.length
    ? el('section', { class: 'loot-card' }, [
      el('h2', { class: 'col-heading' }, [t('lootCaches')]),
      el('ul', { class: 'loot-caches' }, snap.vendorCaches.map((c) =>
        el('li', { class: 'loot-cache' }, [
          el('span', { class: 'loot-cache-type' }, [name(c.type, cacheTypeZh)]),
          lootItem(c.item, 'loot-cache-btn'),
        ]))),
    ])
    : null;

  return [
    el('dl', { class: 'loot-meta' }, [
      meta(t('lootDate'), [snap.date]),
      snap.rotation ? meta(t('lootRotation'), [snap.rotation]) : null,
      meta(t('lootChecked'), [snap.lastChecked || '—']),
      meta(t('lootNext'), next),
    ].filter((n): n is HTMLDivElement => n !== null)),
    ...notices,
    el('section', { class: 'loot-card' }, [
      el('h2', { class: 'col-heading' }, [t('lootMissions')]),
      el('div', { class: 'loot-row loot-row-head' }, [
        el('span', {}, [t('lootMission')]), el('span', {}, [t('lootTarget')]),
      ]),
      missions,
    ]),
    caches,
  ];
}

/**
 * 繪製 / Draw the page. The fetch is shared across calls, so re-rendering on a
 * language switch reuses the snapshot already in hand.
 */
export function renderLootPanel(root: HTMLElement) {
  root.replaceChildren(
    el('h2', { class: 'loot-title' }, [t('lootTitle')]),
    el('p', { class: 'loot-status' }, [t('lootLoading')]),
  );
  void loadLoot().then((snap) => {
    if (!root.isConnected) return;
    const body = snap
      ? renderSnapshot(snap)
      : [el('p', { class: 'loot-notice' }, [
        t('lootFailed'), ' ', sourceLink(), ' ',
        el('button', { class: 'ghost', onclick: () => renderLootPanel(root) }, [t('lootRetry')]),
      ])];
    root.replaceChildren(el('h2', { class: 'loot-title' }, [t('lootTitle')]), ...body.filter((n) => n !== null));
  });
}
