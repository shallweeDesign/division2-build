/** 每日戰利品頁 / The daily loot page: today's rotation, read live. */
import { lang, t } from '../i18n/index.ts';
import { cacheItemZh, cacheTypeZh, isWeaponClass, lootZh, missionZh } from '../i18n/loot.ts';
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
  if (!local) return el('span', { class: 'loot-name' }, [en]);
  return el('span', { class: 'loot-name' }, [local, el('small', {}, [en])]);
}

function sourceLink() {
  return el('a', { href: LOOT_PAGE, target: '_blank', rel: 'noopener' }, ['raigulus.github.io/division-2/loot']);
}

function meta(label: string, value: (Node | string)[]) {
  return el('div', { class: 'loot-meta-item' }, [el('dt', {}, [label]), el('dd', {}, value)]);
}

/**
 * 目標戰利品 / A brand or gear set opens its detail popup; a weapon class has
 * no set behind it, so it stays plain text.
 */
function target(loot: string) {
  if (isWeaponClass(loot)) return el('span', { class: 'loot-target' }, [name(loot, lootZh)]);
  const label = lang() === 'zh-tw' ? lootZh(loot) ?? loot : loot;
  return el('button', {
    class: 'loot-target loot-target-btn',
    type: 'button',
    'aria-haspopup': 'dialog',
    title: fill(t('detailOpen'), { n: label }),
    onclick: () => openLootDetail(loot),
    onpointerenter: () => { void preloadLootData().catch(() => {}); },
    onfocus: () => { void preloadLootData().catch(() => {}); },
  }, [name(loot, lootZh), el('span', { class: 'loot-target-icon', 'aria-hidden': 'true' }, ['›'])]);
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
      target(m.loot),
    ])));

  const caches = snap.vendorCaches.length
    ? el('section', { class: 'loot-card' }, [
      el('h2', { class: 'col-heading' }, [t('lootCaches')]),
      el('ul', { class: 'loot-caches' }, snap.vendorCaches.map((c) =>
        el('li', { class: 'loot-cache' }, [
          el('span', { class: 'loot-cache-type' }, [name(c.type, cacheTypeZh)]),
          el('strong', {}, [name(c.item, cacheItemZh)]),
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
