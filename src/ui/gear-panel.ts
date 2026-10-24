/** 裝備欄 / The six gear slot cards. */
import type { AttributeDef, AttributeSlotSpec, GameData, GearItem, GearSlot, Value } from '../model/types.ts';
import { GEAR_LAYOUT } from '../model/types.ts';
import type { SlotChoice } from '../model/build.ts';
import { attributeIndex, defaultChoice, defaultChoicesFor, eligible } from '../model/calc/index.ts';
import { t, tCategory, tItem, tQuality, tSet, tSlot, tStat, tTalent, tTalentText } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el, select } from './dom.ts';

/** Sort order that puts the common generic pieces first. */
const rank = (i: GearItem) => (i.isExotic ? 3 : i.gearSet ? 2 : i.isNamed ? 1 : 0);
const quality = (i: GearItem) => (i.isExotic ? 'exotic' : i.gearSet ? 'gearset' : i.isNamed ? 'named' : 'high-end');

export function statName(data: GameData, statId: string) {
  const s = data.stats.find((x) => x.id === statId);
  return tStat(statId, s?.name ?? statId);
}

/** Label an attribute by the stat it grants, since ids are not player-facing. */
function attrLabel(data: GameData, def: AttributeDef) {
  return statName(data, def.statId);
}

const fmtValue = (v: Value | null) => (v === null ? '' : v.percent ? `${v.n}%` : String(v.n));

/** Exotic pieces belong to no brand or set, so they get a group of their own. */
const EXOTIC = '__exotic__';
const groupOf = (i: GearItem) => i.brandSet ?? i.gearSet ?? EXOTIC;

/**
 * 品牌的暫存選擇 / Brand picked before a piece is. The build only stores an
 * item id, so the first level of the cascade lives here until then.
 */
const picking: Partial<Record<GearSlot, string | null>> = {};

/** 品牌 → 型號 / The two cascading selects at the top of a card. */
function itemPickers(data: GameData, attrs: Map<string, AttributeDef>, slot: GearSlot, item: GearItem | null) {
  const pool = data.gear[slot];
  const group = item ? groupOf(item) : picking[slot] ?? null;

  const equip = (i: GearItem | null) => update('gear', (b) => {
    b.gear[slot] = i
      ? { itemId: i.id, ...defaultChoicesFor(i, data, attrs) }
      : { itemId: null, cores: [], minors: [], mods: [], talent: null };
  });
  const choose = (next: string | null) => {
    picking[slot] = next;
    const kin = pool.filter((i) => groupOf(i) === next);
    // A brand with a single piece in this slot has nothing left to choose.
    equip(kin.length === 1 ? kin[0]! : null);
  };

  // Brands, then gear sets, then exotics — each alphabetical.
  const kindRank = (g: string) => (g === EXOTIC ? 2 : pool.some((i) => i.gearSet === g) ? 1 : 0);
  const groups = [...new Set(pool.map(groupOf))].sort((a, b) => kindRank(a) - kindRank(b) || a.localeCompare(b));
  const groupLabel = (g: string) =>
    g === EXOTIC ? tQuality('exotic') : kindRank(g) === 1 ? `${tSet(g)}（${tQuality('gearset')}）` : tSet(g);
  const items = group
    ? pool.filter((i) => groupOf(i) === group).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    : [];
  const itemLabel = (i: GearItem) => {
    const name = tItem(i.name, slot, i.brandSet ?? i.gearSet);
    return i.isNamed ? `${name}（${tQuality('named')}）` : name;
  };

  const row = (label: Parameters<typeof t>[0], control: HTMLElement) =>
    el('div', { class: 'row row-pick' }, [el('span', { class: 'row-label' }, [t(label)]), control]);

  return [
    row('gearBrand', select(group, groups.map((g) => [g, groupLabel(g)]), (v) => choose(v || null), t('empty'))),
    row('model', select(item?.id ?? null, items.map((i) => [i.id, itemLabel(i)]),
      (v) => equip(items.find((i) => i.id === v) ?? null), '—')),
  ];
}

/**
 * One attribute row. Fixed slots render as static text; choice slots get a
 * dropdown of eligible attributes plus a value input bounded by that
 * attribute's range.
 */
function attributeRow(
  data: GameData,
  attrs: Map<string, AttributeDef>,
  slot: GearSlot,
  group: 'cores' | 'minors' | 'mods',
  index: number,
  spec: AttributeSlotSpec,
  label: string,
) {
  const choice = (): SlotChoice => build().gear[slot][group][index] ?? { attributeId: null, value: null };
  const current = choice();
  const def = current.attributeId ? attrs.get(current.attributeId) : undefined;

  const value = el('input', {
    type: 'number',
    step: def?.fidelity ? String(def.fidelity.n) : 'any',
    min: def ? String(def.min.n) : undefined,
    max: def ? String((def.protoMax ?? def.max).n) : undefined,
    value: current.value ? String(current.value.n) : '',
    disabled: !def || spec.mode === 'fixed',
    oninput: (e) =>
      update('summary', (b) => {
        const c = b.gear[slot][group][index];
        if (c) c.value = { n: Number((e.target as HTMLInputElement).value) || 0, percent: c.value?.percent ?? true };
      }),
  });

  const control =
    spec.mode === 'fixed'
      ? el('span', { class: 'fixed-stat' }, [def ? attrLabel(data, def) : current.attributeId ?? '—'])
      : select(
          current.attributeId,
          eligible(spec, data).map((a) => [a.id, attrLabel(data, a)] as [string, string]),
          (v) =>
            update('summary', (b) => {
              const picked = v ? attrs.get(v) : undefined;
              b.gear[slot][group][index] = { attributeId: v || null, value: picked ? picked.max : null };
              const d = picked;
              value.disabled = !d;
              value.step = d?.fidelity ? String(d.fidelity.n) : 'any';
              value.min = d ? String(d.min.n) : '';
              value.max = d ? String((d.protoMax ?? d.max).n) : '';
              value.value = d ? String(d.max.n) : '';
            }),
          '—',
        );

  const cat = spec.mode === 'fixed' ? def?.category : undefined;
  return el('div', { class: `row${cat ? ` cat-${cat}` : ''}` }, [
    el('span', { class: 'row-label' }, [label]),
    control,
    value,
    def ? el('span', { class: 'row-max' }, [`↑${fmtValue(def.protoMax ?? def.max)}`]) : null,
  ]);
}

/** 天賦＋天賦內容 / The talent, then its wording beneath. */
function talentRows(data: GameData, slot: GearSlot, item: GearItem) {
  if (!item.talent) return [];
  const text = (name: string | null) => {
    const d = name ? data.gearTalents.find((tl) => tl.name === name)?.description : null;
    return d && name ? el('p', { class: 'talent-text' }, [tTalentText(name, d)]) : null;
  };
  if (item.talent.mode === 'fixed') {
    return [
      el('div', { class: 'row row-talent' }, [
        el('span', { class: 'row-label' }, [t('talent')]),
        el('span', { class: 'fixed-stat' }, [tTalent(item.talent.name)]),
      ]),
      text(item.talent.name),
    ];
  }
  const slug = item.talent.slug;
  const pool = data.gearTalents.filter((tl) => tl.compatibility.includes(slug));
  if (!pool.length) return [];
  const chosen = build().gear[slot].talent;
  return [
    el('div', { class: 'row row-talent' }, [
      el('span', { class: 'row-label' }, [t('talent')]),
      // 'gear' rather than 'summary' so the wording below follows the pick.
      select(chosen, pool.map((tl) => [tl.name, tTalent(tl.name)] as [string, string]),
        (v) => update('gear', (b) => { b.gear[slot].talent = v || null; }), '—'),
    ]),
    text(chosen),
  ];
}

function slotCard(data: GameData, attrs: Map<string, AttributeDef>, slot: GearSlot) {
  const state = build().gear[slot];
  const item = state.itemId ? data.gear[slot].find((i) => i.id === state.itemId) ?? null : null;

  const rows: (Node | null)[] = [];
  if (item) {
    item.cores.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'cores', i, spec, t('core'))));
    item.minors.forEach((spec, i) =>
      rows.push(attributeRow(data, attrs, slot, 'minors', i, spec,
        spec.mode === 'choice' ? categoryLabel(spec.slug) : t('attribute'))));
    item.mods.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'mods', i, spec, t('mod'))));
  }

  return el('section', { class: `slot-card${item ? '' : ' is-empty'}` }, [
    el('header', {}, [
      el('h3', {}, [tSlot(slot)]),
      item ? el('span', { class: `pill q-${quality(item)}` }, [tQuality(quality(item))]) : null,
    ]),
    ...itemPickers(data, attrs, slot, item),
    ...(item ? talentRows(data, slot, item) : []),
    ...rows,
  ]);
}

/** `gear-offensive-minor` → 攻擊 / Offensive; plain slugs get the generic label. */
function categoryLabel(slug: string) {
  if (slug.includes('offensive')) return tCategory('offensive');
  if (slug.includes('defensive')) return tCategory('defensive');
  if (slug.includes('skill')) return tCategory('skill');
  return t('attribute');
}

export function renderGearPanel(root: HTMLElement, data: GameData) {
  const attrs = attributeIndex(data);
  clear(root);
  for (const slot of GEAR_LAYOUT) root.append(slotCard(data, attrs, slot));
}
