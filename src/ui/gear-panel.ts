/** 裝備欄 / The six gear slot cards. */
import type { AttributeDef, AttributeSlotSpec, GameData, GearItem, GearSlot, Value } from '../model/types.ts';
import { GEAR_LAYOUT } from '../model/types.ts';
import type { SlotChoice } from '../model/build.ts';
import { attributeIndex, defaultChoice, defaultChoicesFor, eligible } from '../model/calc/index.ts';
import { t, tCategory, tItem, tQuality, tSet, tSlot, tStat, tTalent } from '../i18n/index.ts';
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

function itemOptions(data: GameData, slot: GearSlot): [string, string][] {
  return [...data.gear[slot]]
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    .map((i) => [i.id, `[${tQuality(quality(i))}] ${tItem(i.name, slot, i.brandSet ?? i.gearSet)}`]);
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

function talentRow(data: GameData, slot: GearSlot, item: GearItem) {
  if (!item.talent) return null;
  if (item.talent.mode === 'fixed') {
    return el('div', { class: 'row row-talent' }, [
      el('span', { class: 'row-label' }, [t('talent')]),
      el('span', { class: 'fixed-stat' }, [tTalent(item.talent.name)]),
    ]);
  }
  const slug = item.talent.slug;
  const pool = data.gearTalents.filter((tl) => tl.compatibility.includes(slug));
  if (!pool.length) return null;
  const state = build().gear[slot];
  return el('div', { class: 'row row-talent' }, [
    el('span', { class: 'row-label' }, [t('talent')]),
    select(state.talent, pool.map((tl) => [tl.name, tTalent(tl.name)] as [string, string]),
      (v) => update('summary', (b) => { b.gear[slot].talent = v || null; }), '—'),
  ]);
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
    rows.push(talentRow(data, slot, item));
  }

  const setName = item?.brandSet ?? item?.gearSet ?? null;
  return el('section', { class: `slot-card${item ? '' : ' is-empty'}` }, [
    el('header', {}, [
      el('h3', {}, [tSlot(slot)]),
      item ? el('span', { class: `pill q-${quality(item)}` }, [tQuality(quality(item))]) : null,
    ]),
    select(state.itemId, itemOptions(data, slot), (v) =>
      update('gear', (b) => {
        if (!v) { b.gear[slot] = { itemId: null, cores: [], minors: [], mods: [], talent: null }; return; }
        const picked = data.gear[slot].find((i) => i.id === v)!;
        b.gear[slot] = { itemId: v, ...defaultChoicesFor(picked, data, attrs) };
      }), t('empty')),
    setName ? el('p', { class: `brand${item?.gearSet ? ' is-set' : ''}` }, [tSet(setName)]) : null,
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
