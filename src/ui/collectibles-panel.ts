/**
 * 收集品頁 / Collectibles: an overview of every collection, then one sub-tab
 * per collection.
 *
 * Sub-tabs are a hash route (`#broken-rain-beavers`), so each can be linked
 * to directly; no hash is the overview. A new collection is a data file in
 * `data/collectibles/` plus an entry in its `COLLECTIONS`.
 *
 * Progress lives in the player's data, so it follows them between browsers
 * once they sign in.
 *
 * Screenshots are the owner's own: drop `01.jpg`, `02.jpg` … (or .png/.webp)
 * into `src/assets/collectibles/<collection>/` and rebuild. An item with no
 * file shows an empty strip and the guide link instead.
 */
import { lang, t } from '../i18n/index.ts';
import { COLLECTIONS } from '../data/collectibles/index.ts';
import { itemsOf } from '../data/collectibles/types.ts';
import type { Bilingual, Collection, CollectItem } from '../data/collectibles/types.ts';
import { el } from './dom.ts';
import { updateUserData, userData } from '../cloud/user-data.ts';

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

const say = (b: Bilingual) => (lang() === 'zh-tw' ? b.zh : b.en);

/** Screenshots present at build time, keyed by collection and item number. */
const SHOTS = import.meta.glob('../assets/collectibles/*/*.{jpg,jpeg,png,webp}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

function shotFor(collection: string, n: number): string | null {
  const want = String(n).padStart(2, '0');
  for (const [path, url] of Object.entries(SHOTS)) {
    const m = /collectibles\/([^/]+)\/(\d+)\.\w+$/.exec(path);
    if (m && m[1] === collection && m[2]!.padStart(2, '0') === want) return url;
  }
  return null;
}

/**
 * 進度 / Which items this player has ticked. Kept in their data
 * (`cloud/user-data.ts`): in this browser, and in their account once signed in.
 * Numbers no longer in the collection are ignored when counting.
 */
function progress(c: Collection) {
  const valid = new Set(itemsOf(c).map((i) => i.n));
  const list = () => (userData().collectibles[c.id] ?? []).filter((n) => valid.has(n));
  return {
    has: (n: number) => list().includes(n),
    toggle: (n: number) => updateUserData((d) => {
      const cur = new Set(d.collectibles[c.id] ?? []);
      if (cur.has(n)) cur.delete(n); else cur.add(n);
      d.collectibles[c.id] = [...cur];
    }),
    clear: () => updateUserData((d) => { d.collectibles[c.id] = []; }),
    get size() { return list().length; },
    total: valid.size,
  };
}

/** The badge in front of an item's name: its number, or what it is. */
function badge(c: Collection, item: CollectItem) {
  if (item.kind === 'echo') return 'ECHO';
  if (item.kind === 'trophy') return t('collectTrophyBadge');
  if (item.kind === 'key') {
    const keys = itemsOf(c).filter((i) => i.kind === 'key');
    return `${t('collectKeyBadge')} ${keys.indexOf(item) + 1}`;
  }
  return String(item.n).padStart(2, '0');
}

function progressBar(done: number, total: number) {
  const bar = el('span', { class: 'collect-bar' }, [el('span', { class: 'collect-bar-fill' })]);
  (bar.firstChild as HTMLElement).style.width = `${total ? (done / total) * 100 : 0}%`;
  return bar;
}

function renderCollection(c: Collection, root: HTMLElement) {
  const state = progress(c);
  const zh = lang() === 'zh-tw';

  const counter = el('strong', { class: 'collect-count' });
  const bar = el('span', { class: 'collect-bar-fill' });
  const update = () => {
    counter.replaceChildren(fill(t('collectProgress'), { n: String(state.size), total: String(state.total) }));
    bar.style.width = `${(state.size / state.total) * 100}%`;
  };

  const card = (item: CollectItem) => {
    const shot = shotFor(c.id, item.n);
    const name = zh ? item.zh : item.en;
    const box = el('input', {
      type: 'checkbox', checked: state.has(item.n),
      'aria-label': fill(t('collectMark'), { name }),
      onchange: () => { state.toggle(item.n); li.classList.toggle('found', state.has(item.n)); update(); },
    });
    const li = el('li', {
      class: `collect-item${item.kind ? ` kind-${item.kind}` : ''}${state.has(item.n) ? ' found' : ''}`,
      id: `${c.id}-${item.n}`,
    }, [
      shot
        ? el('a', { class: 'collect-shot', href: shot, target: '_blank', rel: 'noopener' }, [
          el('img', { src: shot, alt: `${badge(c, item)} ${name}`, loading: 'lazy' }),
        ])
        : el('div', { class: 'collect-shot empty' }, [el('span', {}, [t('collectNoShot')])]),
      el('div', { class: 'collect-text' }, [
        el('label', { class: 'collect-head' }, [
          box,
          el('span', { class: 'collect-num' }, [badge(c, item)]),
          el('span', { class: 'collect-name' }, zh && item.en !== item.zh ? [item.zh, el('small', {}, [item.en])] : [name]),
        ]),
        zh ? el('p', { class: 'collect-where' }, [item.where]) : null,
        zh && item.tip ? el('p', { class: 'collect-tip' }, [item.tip]) : null,
        el('a', { class: 'collect-link', href: c.link(item), target: '_blank', rel: 'noopener' }, [t('collectWatch')]),
      ]),
    ]);
    return li;
  };

  root.replaceChildren(
    el('div', { class: 'collect-summary' }, [
      el('div', {}, [
        el('h2', { class: 'loot-title' }, [say(c.title)]),
        el('p', { class: 'collect-intro' }, [say(c.intro)]),
      ]),
      el('div', { class: 'collect-progress' }, [
        counter,
        el('span', { class: 'collect-bar' }, [bar]),
        el('button', {
          class: 'ghost', type: 'button',
          onclick: () => { state.clear(); renderCollection(c, root); },
        }, [t('collectReset')]),
      ]),
    ]),
    el('details', { class: 'loot-card collect-rules', open: true }, [
      el('summary', { class: 'col-heading' }, [t('collectRules')]),
      zh
        ? el('ul', {}, c.rules.map((r) => el('li', {}, [r])))
        : el('p', {}, [t('collectEnglishNote')]),
    ]),
    ...c.stages.map((stage) => el('section', { class: 'collect-stage' }, [
      el('h3', { class: 'col-heading' }, [say(stage)]),
      el('ol', { class: 'collect-list' }, stage.items.map(card)),
    ])),
    el('p', { class: 'd-note' }, [
      say(c.source), ' ',
      ...c.guides.flatMap((g, i) => [
        i ? ' · ' : '',
        el('a', { href: g.url, target: '_blank', rel: 'noopener' }, [g.name]),
      ]),
    ]),
  );
  update();
}

/** 總覽 / One card per collection with its mission, reward and progress. */
function renderOverview(root: HTMLElement) {
  const rows = COLLECTIONS.map((c) => ({ c, state: progress(c) }));
  const done = rows.reduce((n, r) => n + r.state.size, 0);
  const total = rows.reduce((n, r) => n + r.state.total, 0);

  const counts = (c: Collection) => {
    const items = itemsOf(c);
    const of = (k: NonNullable<CollectItem['kind']>) => items.filter((i) => (i.kind ?? 'collectible') === k).length;
    return [
      of('collectible') ? fill(t('collectCountItems'), { n: String(of('collectible')) }) : null,
      of('key') ? fill(t('collectCountKeys'), { n: String(of('key')) }) : null,
      of('echo') ? fill(t('collectCountEcho'), { n: String(of('echo')) }) : null,
      of('trophy') ? fill(t('collectCountTrophy'), { n: String(of('trophy')) }) : null,
    ].filter(Boolean).join(' · ');
  };

  root.replaceChildren(
    el('div', { class: 'collect-summary' }, [
      el('div', {}, [
        el('h2', { class: 'loot-title' }, [t('collectOverviewTitle')]),
        el('p', { class: 'collect-intro' }, [t('collectOverviewIntro')]),
      ]),
      el('div', { class: 'collect-progress' }, [
        el('strong', { class: 'collect-count' }, [fill(t('collectProgress'), { n: String(done), total: String(total) })]),
        progressBar(done, total),
      ]),
    ]),
    el('ul', { class: 'collect-index' }, rows.map(({ c, state }) => el('li', {
      class: `collect-card${state.size === state.total ? ' complete' : ''}`,
    }, [
      el('a', { href: `#${c.id}` }, [
        el('span', { class: 'collect-card-type' }, [say(c.type)]),
        el('strong', { class: 'collect-card-name' }, [say(c.tab)]),
        el('span', { class: 'collect-card-reward' }, [say(c.reward)]),
        el('span', { class: 'collect-card-counts' }, [counts(c)]),
        el('span', { class: 'collect-card-progress' }, [
          el('span', { class: 'collect-count' }, [fill(t('collectProgress'), { n: String(state.size), total: String(state.total) })]),
          progressBar(state.size, state.total),
        ]),
      ]),
    ]))),
  );
}

/** 子分頁 / The overview, then each collection. */
const TABS = [
  { id: '', label: () => t('collectOverviewTab'), render: renderOverview },
  ...COLLECTIONS.map((c) => ({ id: c.id, label: () => say(c.tab), render: (root: HTMLElement) => renderCollection(c, root) })),
];

const current = () => TABS.find((tab) => tab.id === location.hash.slice(1)) ?? TABS[0]!;

export function renderCollectiblesPanel(root: HTMLElement) {
  const active = current();
  const body = el('div', { class: 'collect-body' });
  root.replaceChildren(
    el('nav', { class: 'subtabs', 'aria-label': t('navCollectibles') }, TABS.map((tab) => el('a', {
      class: `subtab${tab === active ? ' active' : ''}`,
      href: `#${tab.id}`,
      'aria-current': tab === active ? 'page' : undefined,
    }, [tab.label()]))),
    body,
  );
  active.render(body);
}
