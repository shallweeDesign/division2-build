/**
 * 收集品頁 / Collectibles, one sub-tab per collection.
 *
 * Sub-tabs are a hash route (`#broken-rain-beavers`), so each can be linked
 * to directly. A new collection is a new entry in `COLLECTIONS`.
 *
 * Screenshots are the owner's own: drop `01.jpg` … `30.jpg` (or .png/.webp)
 * into `src/assets/collectibles/<collection>/` and rebuild. A location with no
 * file shows an empty frame and the guide link instead.
 */
import { lang, t } from '../i18n/index.ts';
import {
  BEAVER_COUNT, BEAVER_GUIDE, BEAVER_RULES, BEAVER_STAGES, beaverAnchor,
} from '../data/collectibles/broken-rain-beavers.ts';
import type { Beaver } from '../data/collectibles/broken-rain-beavers.ts';
import { el } from './dom.ts';

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

/** Screenshots present at build time, keyed by collection and location number. */
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
 * 進度 / Which locations this viewer has ticked, kept in their own browser.
 * Storage can be missing or throw (private mode, blocked site data), so every
 * access is guarded and the page works without it.
 */
function progress(collection: string) {
  const key = `d2b.collect.${collection}`;
  let found = new Set<number>();
  try { found = new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as number[]); } catch { /* none */ }
  const save = () => { try { localStorage.setItem(key, JSON.stringify([...found])); } catch { /* ignore */ } };
  return {
    has: (n: number) => found.has(n),
    toggle: (n: number) => { if (found.has(n)) found.delete(n); else found.add(n); save(); },
    clear: () => { found = new Set(); save(); },
    get size() { return found.size; },
  };
}

function renderBeavers(root: HTMLElement) {
  const id = 'broken-rain-beavers';
  const state = progress(id);
  const zh = lang() === 'zh-tw';

  const counter = el('strong', { class: 'collect-count' });
  const bar = el('span', { class: 'collect-bar-fill' });
  const update = () => {
    counter.replaceChildren(fill(t('collectProgress'), { n: String(state.size), total: String(BEAVER_COUNT) }));
    bar.style.width = `${(state.size / BEAVER_COUNT) * 100}%`;
  };

  const card = (b: Beaver) => {
    const shot = shotFor(id, b.n);
    const box = el('input', {
      type: 'checkbox', checked: state.has(b.n),
      'aria-label': fill(t('collectMark'), { n: String(b.n) }),
      onchange: () => { state.toggle(b.n); item.classList.toggle('found', state.has(b.n)); update(); },
    });
    const item = el('li', { class: `collect-item${state.has(b.n) ? ' found' : ''}`, id: `beaver-${b.n}` }, [
      shot
        ? el('a', { class: 'collect-shot', href: shot, target: '_blank', rel: 'noopener' }, [
          el('img', { src: shot, alt: `${b.n}. ${zh ? b.zh : b.en}`, loading: 'lazy' }),
        ])
        : el('div', { class: 'collect-shot empty' }, [el('span', {}, [t('collectNoShot')])]),
      el('div', { class: 'collect-text' }, [
        el('label', { class: 'collect-head' }, [
          box,
          el('span', { class: 'collect-num' }, [String(b.n).padStart(2, '0')]),
          el('span', { class: 'collect-name' }, zh ? [b.zh, el('small', {}, [b.en])] : [b.en]),
        ]),
        zh ? el('p', { class: 'collect-where' }, [b.where]) : null,
        zh && b.tip ? el('p', { class: 'collect-tip' }, [b.tip]) : null,
        el('a', { class: 'collect-link', href: beaverAnchor(b), target: '_blank', rel: 'noopener' }, [t('collectWatch')]),
      ]),
    ]);
    return item;
  };

  root.replaceChildren(
    el('div', { class: 'collect-summary' }, [
      el('div', {}, [
        el('h2', { class: 'loot-title' }, [t('beaversTitle')]),
        el('p', { class: 'collect-intro' }, [t('beaversIntro')]),
      ]),
      el('div', { class: 'collect-progress' }, [
        counter,
        el('span', { class: 'collect-bar' }, [bar]),
        el('button', {
          class: 'ghost', type: 'button',
          onclick: () => { state.clear(); renderBeavers(root); },
        }, [t('collectReset')]),
      ]),
    ]),
    el('details', { class: 'loot-card collect-rules', open: true }, [
      el('summary', { class: 'col-heading' }, [t('collectRules')]),
      zh
        ? el('ul', {}, BEAVER_RULES.map((r) => el('li', {}, [r])))
        : el('p', {}, [t('collectEnglishNote')]),
    ]),
    ...BEAVER_STAGES.map((stage) => el('section', { class: 'collect-stage' }, [
      el('h3', { class: 'col-heading' }, [zh ? stage.zh : stage.en]),
      el('ol', { class: 'collect-list' }, stage.beavers.map(card)),
    ])),
    el('p', { class: 'd-note' }, [
      t('collectSource'), ' ',
      el('a', { href: BEAVER_GUIDE, target: '_blank', rel: 'noopener' }, ['Item Level Gaming']),
    ]),
  );
  update();
}

/** 收集品清單 / Each sub-tab: its hash id, label and renderer. */
const COLLECTIONS = [
  { id: 'broken-rain-beavers', label: () => t('beaversTab'), render: renderBeavers },
];

const current = () => COLLECTIONS.find((c) => `#${c.id}` === location.hash) ?? COLLECTIONS[0]!;

export function renderCollectiblesPanel(root: HTMLElement) {
  const active = current();
  const body = el('div', { class: 'collect-body' });
  root.replaceChildren(
    el('nav', { class: 'subtabs', 'aria-label': t('navCollectibles') }, COLLECTIONS.map((c) => el('a', {
      class: `subtab${c === active ? ' active' : ''}`,
      href: `#${c.id}`,
      'aria-current': c === active ? 'page' : undefined,
    }, [c.label()]))),
    body,
  );
  active.render(body);
}
