/**
 * 戰利品詳情視窗 / The popup behind a loot target: the brand or set's bonus
 * tiers, its chest/backpack talents, and every piece by slot, named pieces
 * picked out in their own colour.
 *
 * A native `<dialog>`: Esc closes it, focus is trapped and restored, and the
 * backdrop dims the page without any of that being written here.
 */
import { lang, t, tItem, tSet, tSlot, tStat, tTalent } from '../i18n/index.ts';
import type { Category, Value } from '../model/types.ts';
import { setDetail } from '../model/set-detail.ts';
import type { CoreView, MinorView, PieceView, SetData, SetDetail } from '../model/set-detail.ts';
import { el } from './dom.ts';

let dataPromise: Promise<SetData> | null = null;

/**
 * 載入資料 / Fetch the dataset slice once. Called on hover as well as click, so
 * by the time a pointer has travelled to a row the chunk is usually in hand.
 */
export function preloadLootData(): Promise<SetData> {
  dataPromise ??= import('../data/loot-data.ts').then((m) => m.lootData);
  dataPromise.catch(() => { dataPromise = null; });  // let a later click retry
  return dataPromise;
}

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

const fmtValue = (v: Value) => `+${Math.round(v.n * 100) / 100}${v.percent ? '%' : ''}`;
const catClass = (c: Category | null) => (c ? `cat-${c}` : 'cat-none');

/** Chinese first with the English beneath, as on the loot list. */
function bilingual(local: string, en: string) {
  return lang() === 'zh-tw' && local !== en
    ? [local, el('small', { class: 'en' }, [en])]
    : [en];
}

function render(d: SetDetail, data: SetData) {
  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const stat = (id: string | null) => (id ? tStat(id, statName.get(id) ?? id) : '—');

  const talentBlock = (name: string, description: string | null) =>
    el('div', { class: 'd-talent' }, [
      el('strong', {}, bilingual(tTalent(name), name)),
      description ? el('p', {}, [description]) : null,
    ]);

  // 套裝效果 / Bonus tiers, then (gear sets only) the chest and backpack talents.
  const tierRows = d.tiers.map((tier) => el('tr', {}, [
    el('th', { scope: 'row' }, [fill(t('detailPieces'), { n: String(tier.pieces) })]),
    el('td', {}, tier.entries.map((e) => (e.kind === 'stat'
      ? el('div', { class: `d-stat ${catClass(e.category)}` }, [
        el('span', { class: 'd-value' }, [fmtValue(e.value)]), ' ', stat(e.statId),
      ])
      : talentBlock(e.name, e.description)))),
  ]));
  const slotTalentRows = d.slotTalents.map((st) => el('tr', { class: 'd-slot-talent' }, [
    el('th', { scope: 'row' }, [tSlot(st.slot)]),
    el('td', {}, [talentBlock(st.name, st.description)]),
  ]));

  const core = (c: CoreView) => (c.fixed
    ? el('span', { class: `d-chip ${catClass(c.category)}` }, [`${stat(c.statId)} ${fmtValue(c.value)}`])
    : el('span', { class: `d-chip ${catClass(c.category)}` }, [stat(c.statId)]));
  const minor = (m: MinorView) => (m.fixed
    ? el('span', { class: `d-attr fixed ${catClass(m.category)}` }, [`${stat(m.statId)} ${fmtValue(m.value)}`])
    : el('span', { class: 'd-attr random' }, [t('detailRandom')]));

  const pieceRow = (p: PieceView) => el('li', { class: `d-piece${p.item.isNamed ? ' named' : ''}` }, [
    el('div', { class: 'd-piece-name' }, [
      ...bilingual(tItem(p.item.name, p.item.slot, d.set.name), p.item.name),
      p.item.isNamed ? el('span', { class: 'd-tag' }, [t('detailNamed')]) : null,
    ]),
    el('div', { class: 'd-piece-cores' }, p.cores.map(core)),
    el('div', { class: 'd-piece-attrs' }, p.minors.map(minor)),
    el('div', { class: 'd-piece-extra' }, [
      p.talent === null ? null
        : p.talent.fixed
          ? el('span', { class: 'd-piece-talent', title: p.talent.description ?? '' }, [tTalent(p.talent.name)])
          : el('span', { class: 'd-attr random' }, [t('detailTalentChoice')]),
      p.mods ? el('span', { class: 'd-mods' }, [fill(t('detailMods'), { n: String(p.mods) })]) : null,
    ]),
  ]);

  return [
    el('section', { class: 'd-section' }, [
      el('h3', { class: 'col-heading' }, [t('detailBonuses')]),
      el('table', { class: 'd-tiers' }, [el('tbody', {}, [...tierRows, ...slotTalentRows])]),
    ]),
    el('section', { class: 'd-section' }, [
      el('h3', { class: 'col-heading' }, [t('detailItems')]),
      el('div', { class: 'd-slots' }, d.pieces.map(({ slot, items }) => el('div', { class: 'd-slot' }, [
        el('div', { class: 'd-slot-name' }, [tSlot(slot)]),
        el('ul', { class: 'd-pieces' }, items.map(pieceRow)),
      ]))),
    ]),
    lang() === 'zh-tw' ? el('p', { class: 'd-note' }, [t('detailTalentEn')]) : null,
  ];
}

/** 開啟 / Open the popup for one loot target, by the source's own name for it. */
export function openLootDetail(name: string) {
  const body = el('div', { class: 'd-body' }, [el('p', { class: 'loot-status' }, [t('detailLoading')])]);
  const heading = el('div', { class: 'd-heading' }, [el('h2', {}, [name])]);
  const dialog = el('dialog', { class: 'loot-dialog', 'aria-label': name }, [
    el('header', { class: 'd-header' }, [
      heading,
      el('button', { class: 'ghost d-close', 'aria-label': t('detailClose'), onclick: () => dialog.close() }, ['×']),
    ]),
    body,
  ]);
  // A click that lands on the dialog element itself is on the backdrop.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();

  preloadLootData().then((data) => {
    const d = setDetail(data, name);
    if (!d) {
      body.replaceChildren(el('p', { class: 'loot-notice' }, [fill(t('detailMissing'), { n: name })]));
      return;
    }
    const kind = d.set.kind === 'brand' ? t('detailBrand') : t('detailGearset');
    heading.replaceChildren(
      el('h2', {}, bilingual(tSet(d.set.name), d.set.name)),
      el('div', { class: 'd-meta' }, [
        el('span', { class: `pill ${d.set.kind}` }, [kind]),
        d.set.defaultCoreStatId
          ? el('span', { class: `d-chip ${catClass(d.coreCategory)}` }, [
            `${t('detailCore')}：${tStat(d.set.defaultCoreStatId, data.stats.find((s) => s.id === d.set.defaultCoreStatId)?.name ?? d.set.defaultCoreStatId)}`,
          ])
          : null,
      ]),
    );
    body.replaceChildren(...render(d, data).filter((n): n is HTMLElement => n !== null));
  }, () => {
    body.replaceChildren(el('p', { class: 'loot-notice' }, [t('detailFailed')]));
  });
}
