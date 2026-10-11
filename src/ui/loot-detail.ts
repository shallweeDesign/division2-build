/**
 * 戰利品詳情視窗 / The popup behind a loot target.
 *
 * A brand or gear set shows its bonus tiers, its chest/backpack talents and
 * every piece by slot. A weapon class shows every weapon it can drop —
 * exotics, then named, then regular. A gear slot shows its exotic and named
 * pieces. Named and exotic items are picked out in
 * their own colours, and every fixed talent is shown with its full wording.
 *
 * A native `<dialog>`: Esc closes it, focus is trapped and restored, and the
 * backdrop dims the page without any of that being written here.
 */
import { lang, t, tDetailTier, tGearTier, tItem, tSet, tSlot, tStat, tTalent, tWeapon, tWeaponType } from '../i18n/index.ts';
import type { Category, Value } from '../model/types.ts';
import { setDetail } from '../model/set-detail.ts';
import type { CoreView, MinorView, PieceView, SetData, SetDetail } from '../model/set-detail.ts';
import { weaponClassOf, weaponDetail } from '../model/weapon-detail.ts';
import { gearSlotDetail, gearSlotOf } from '../model/gear-slot-detail.ts';
import type { GearSlotDetail } from '../model/gear-slot-detail.ts';
import type { WeaponDetail, WeaponView } from '../model/weapon-detail.ts';
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

/** Shared by both popups: stat names, and the core / attribute / talent cells. */
function parts(data: SetData) {
  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const stat = (id: string | null) => (id ? tStat(id, statName.get(id) ?? id) : '—');

  const core = (c: CoreView) => el('span', { class: `d-chip ${catClass(c.category)}` }, [
    c.fixed ? `${stat(c.statId)} ${fmtValue(c.value)}` : stat(c.statId),
  ]);
  const minor = (m: MinorView) => (m.fixed
    ? el('span', { class: `d-attr fixed ${catClass(m.category)}` }, [`${stat(m.statId)} ${fmtValue(m.value)}`])
    : el('span', { class: 'd-attr random' }, [t('detailRandom')]));

  /** 天賦 / A talent's name with its full wording beneath. */
  const talentBlock = (name: string, description: string | null, cls = 'd-talent') =>
    el('div', { class: cls }, [
      el('strong', {}, bilingual(tTalent(name), name)),
      description ? el('p', {}, [description]) : null,
    ]);

  /**
   * 裝備列 / One gear piece. Named pieces in gold, exotics in red; `showSet`
   * adds the brand or set a piece belongs to, for lists that mix them.
   */
  const pieceRow = (p: PieceView, setName: string | null, showSet = false) => {
    const tier = p.item.isExotic ? 'exotic' : p.item.isNamed ? 'named' : '';
    return el('li', { class: `d-piece ${tier}`.trim() }, [
      el('div', { class: 'd-piece-name' }, [
        ...bilingual(tItem(p.item.name, p.item.slot, setName), p.item.name),
        p.item.isExotic ? el('span', { class: 'd-tag' }, [t('detailExoticTag')])
          : p.item.isNamed ? el('span', { class: 'd-tag' }, [t('detailNamed')]) : null,
        showSet && setName ? el('span', { class: 'd-piece-set' }, [tSet(setName)]) : null,
      ]),
      el('div', { class: 'd-piece-cores' }, p.cores.map(core)),
      el('div', { class: 'd-piece-attrs' }, p.minors.map(minor)),
      el('div', { class: 'd-piece-extra' }, [
        p.talent && !p.talent.fixed ? el('span', { class: 'd-attr random' }, [t('detailTalentChoice')]) : null,
        p.mods ? el('span', { class: 'd-mods' }, [fill(t('detailMods'), { n: String(p.mods) })]) : null,
      ]),
      p.talent?.fixed ? talentBlock(p.talent.name, p.talent.description, 'd-talent d-piece-talent') : null,
    ]);
  };

  return { stat, core, minor, talentBlock, pieceRow };
}

function renderSet(d: SetDetail, data: SetData) {
  const { stat, talentBlock, pieceRow } = parts(data);

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

  return [
    el('section', { class: 'd-section' }, [
      el('h3', { class: 'col-heading' }, [t('detailBonuses')]),
      el('table', { class: 'd-tiers' }, [el('tbody', {}, [...tierRows, ...slotTalentRows])]),
    ]),
    el('section', { class: 'd-section' }, [
      el('h3', { class: 'col-heading' }, [t('detailItems')]),
      el('div', { class: 'd-slots' }, d.pieces.map(({ slot, items }) => el('div', { class: 'd-slot' }, [
        el('div', { class: 'd-slot-name' }, [tSlot(slot)]),
        el('ul', { class: 'd-pieces' }, items.map((p) => pieceRow(p, d.set.name))),
      ]))),
    ]),
  ];
}

function renderGearSlot(d: GearSlotDetail, data: SetData) {
  const { pieceRow } = parts(data);
  return d.groups.map((g) => el('section', { class: 'd-section' }, [
    el('h3', { class: `col-heading d-tier-heading ${g.tier}` }, [
      `${tGearTier(g.tier)} (${g.pieces.length})`,
    ]),
    el('ul', { class: 'd-pieces d-weapons' }, g.pieces.map(({ piece, setName }) => pieceRow(piece, setName, true))),
  ]));
}

function renderWeapons(d: WeaponDetail, data: SetData) {
  const { core, minor, talentBlock } = parts(data);

  const numbers = (w: WeaponView['weapon']) => [
    w.baseDamage !== null ? `${t('baseDamage')} ${Math.round(w.baseDamage).toLocaleString('en-US')}` : null,
    w.rpm !== null ? `${t('detailRpm')} ${w.rpm}` : null,
    w.magSize !== null ? `${t('magazine')} ${w.magSize}` : null,
  ].filter((s): s is string => s !== null).join(' · ');

  const row = (v: WeaponView) => {
    const w = v.weapon;
    const tier = w.isExotic ? 'exotic' : w.isNamed ? 'named' : '';
    return el('li', { class: `d-piece d-weapon ${tier}` }, [
      el('div', { class: 'd-piece-name' }, [
        ...bilingual(tWeapon(w.name), w.name),
        w.isExotic ? el('span', { class: 'd-tag' }, [t('detailExoticTag')])
          : w.isNamed ? el('span', { class: 'd-tag' }, [t('detailNamed')]) : null,
        el('small', { class: 'd-weapon-numbers' }, [numbers(w)]),
      ]),
      el('div', { class: 'd-piece-cores' }, v.cores.map(core)),
      el('div', { class: 'd-piece-attrs' }, v.minors.map(minor)),
      el('div', { class: 'd-piece-extra' }, [
        v.talent && !v.talent.fixed ? el('span', { class: 'd-attr random' }, [t('detailTalentChoice')]) : null,
      ]),
      v.talent?.fixed ? talentBlock(v.talent.name, v.talent.description, 'd-talent d-piece-talent') : null,
    ]);
  };

  return d.groups.map((g) => el('section', { class: 'd-section' }, [
    el('h3', { class: `col-heading d-tier-heading ${g.tier}` }, [
      `${tDetailTier(g.tier)} (${g.weapons.length})`,
    ]),
    el('ul', { class: 'd-pieces d-weapons' }, g.weapons.map(row)),
  ]));
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

  const note = () => (lang() === 'zh-tw' ? el('p', { class: 'd-note' }, [t('detailTalentEn')]) : null);
  const show = (nodes: (HTMLElement | null)[]) =>
    body.replaceChildren(...nodes.filter((n): n is HTMLElement => n !== null));

  preloadLootData().then((data) => {
    if (gearSlotOf(name)) {
      const d = gearSlotDetail(data, name)!;
      const total = d.groups.reduce((n, g) => n + g.pieces.length, 0);
      heading.replaceChildren(
        el('h2', {}, [tSlot(d.slot)]),
        el('div', { class: 'd-meta' }, [
          el('span', { class: 'pill weapon' }, [t('detailGearSlot')]),
          el('span', { class: 'd-count' }, [fill(t('detailPieceCount'), { n: String(total) })]),
        ]),
      );
      show([...renderGearSlot(d, data), note()]);
      return;
    }
    if (weaponClassOf(name)) {
      const d = weaponDetail(data, name)!;
      const total = d.groups.reduce((n, g) => n + g.weapons.length, 0);
      heading.replaceChildren(
        el('h2', {}, bilingual(tWeaponType(d.weaponType), d.weaponType)),
        el('div', { class: 'd-meta' }, [
          el('span', { class: 'pill weapon' }, [t('detailWeaponClass')]),
          el('span', { class: 'd-count' }, [fill(t('detailWeaponCount'), { n: String(total) })]),
        ]),
      );
      show([...renderWeapons(d, data), note()]);
      return;
    }

    const d = setDetail(data, name);
    if (!d) {
      show([el('p', { class: 'loot-notice' }, [fill(t('detailMissing'), { n: name })])]);
      return;
    }
    const coreName = d.set.defaultCoreStatId
      ? tStat(d.set.defaultCoreStatId, data.stats.find((s) => s.id === d.set.defaultCoreStatId)?.name ?? d.set.defaultCoreStatId)
      : null;
    heading.replaceChildren(
      el('h2', {}, bilingual(tSet(d.set.name), d.set.name)),
      el('div', { class: 'd-meta' }, [
        el('span', { class: `pill ${d.set.kind}` }, [d.set.kind === 'brand' ? t('detailBrand') : t('detailGearset')]),
        coreName ? el('span', { class: `d-chip ${catClass(d.coreCategory)}` }, [`${t('detailCore')}：${coreName}`]) : null,
      ]),
    );
    show([...renderSet(d, data), note()]);
  }, () => {
    show([el('p', { class: 'loot-notice' }, [t('detailFailed')])]);
  });
}
