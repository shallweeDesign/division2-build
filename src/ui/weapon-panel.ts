/**
 * 武器欄 / The three weapon slot cards.
 *
 * Mirrors the gear panel's row layout so the two read as one interface, but a
 * weapon carries parts as well as attributes, and only the primary and
 * secondary take main weapons — the sidearm slot takes pistols.
 */
import type { AttributeDef, AttributeSlotSpec, GameData, Value, Weapon, WeaponSlot } from '../model/types.ts';
import { WEAPON_SLOTS } from '../model/types.ts';
import type { SlotChoice } from '../model/build.ts';
import { attributeIndex, defaultChoice, eligible, eligibleMods } from '../model/calc/index.ts';
import { t, tQuality, tStat, tTalent, tWeapon, tWeaponSlot, tWeaponType } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el, select } from './dom.ts';

const quality = (w: Weapon) => (w.isExotic ? 'exotic' : w.isNamed ? 'named' : 'high-end');
const rank = (w: Weapon) => (w.isExotic ? 2 : w.isNamed ? 1 : 0);

const fmtValue = (v: Value | null) => (v === null ? '' : v.percent ? `${v.n}%` : String(v.n));

/** Only pistols go in the sidearm hand; everything else is a main weapon. */
const fits = (w: Weapon, slot: WeaponSlot) =>
  slot === 'sidearm' ? w.slotType === 'sidearm' : w.slotType === 'main';

function weaponOptions(data: GameData, slot: WeaponSlot): [string, string][] {
  return data.weapons
    .filter((w) => fits(w, slot))
    .sort((a, b) => rank(a) - rank(b) || a.weaponType.localeCompare(b.weaponType) || a.name.localeCompare(b.name))
    .map((w) => [w.id, `[${tWeaponType(w.weaponType)}] ${tWeapon(w.name)}`]);
}

/** The choices a freshly equipped weapon starts with: fixed slots decided, rest empty. */
function defaultsFor(w: Weapon, attrs: Map<string, AttributeDef>) {
  return {
    cores: w.cores.map((spec) => defaultChoice(spec, attrs)),
    minors: w.minors.map((spec) => defaultChoice(spec, attrs)),
    mods: w.mods.map(() => null as string | null),
    talent: w.talent?.mode === 'fixed' ? w.talent.name : null,
  };
}

function attributeRow(
  data: GameData,
  attrs: Map<string, AttributeDef>,
  slot: WeaponSlot,
  group: 'cores' | 'minors',
  index: number,
  spec: AttributeSlotSpec,
  label: string,
) {
  const current: SlotChoice = build().weapons[slot][group][index] ?? { attributeId: null, value: null };
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
        const c = b.weapons[slot][group][index];
        if (c) c.value = { n: Number((e.target as HTMLInputElement).value) || 0, percent: c.value?.percent ?? true };
      }),
  });

  const control =
    spec.mode === 'fixed'
      ? el('span', { class: 'fixed-stat' }, [def ? tStat(def.statId, def.statId) : current.attributeId ?? '—'])
      : select(
          current.attributeId,
          eligible(spec, data).map((a) => [a.id, tStat(a.statId, a.statId)] as [string, string]),
          (v) =>
            update('summary', (b) => {
              const picked = v ? attrs.get(v) : undefined;
              b.weapons[slot][group][index] = { attributeId: v || null, value: picked ? picked.max : null };
              value.disabled = !picked;
              value.value = picked ? String(picked.max.n) : '';
            }),
          '—',
        );

  return el('div', { class: 'row' }, [
    el('span', { class: 'row-label' }, [label]),
    control,
    value,
    def ? el('span', { class: 'row-max' }, [`↑${fmtValue(def.protoMax ?? def.max)}`]) : null,
  ]);
}

/** One part slot. A fixed part is shown but cannot be changed. */
function modRow(data: GameData, slot: WeaponSlot, index: number, spec: Weapon['mods'][number]) {
  if (spec.mode === 'fixed') {
    return el('div', { class: 'row row-mod' }, [
      el('span', { class: 'row-label' }, [t(spec.category)]),
      el('span', { class: 'fixed-stat' }, [spec.name]),
    ]);
  }
  const pool = eligibleMods(data, spec);
  if (!pool.length) return null;
  const chosen = build().weapons[slot].mods[index] ?? null;
  const summarise = (statIds: { statId: string; value: Value }[]) =>
    statIds.map((s) => `${tStat(s.statId, s.statId)} ${s.value.n > 0 ? '+' : ''}${fmtValue(s.value)}`).join('、');

  return el('div', { class: 'row row-mod' }, [
    el('span', { class: 'row-label' }, [t(spec.category)]),
    select(
      chosen,
      pool.map((m) => [m.name, `${m.name} — ${summarise(m.stats)}`] as [string, string]),
      (v) => update('summary', (b) => { b.weapons[slot].mods[index] = v || null; }),
      '—',
    ),
  ]);
}

function talentRow(data: GameData, slot: WeaponSlot, weapon: Weapon) {
  if (!weapon.talent) return null;
  if (weapon.talent.mode === 'fixed') {
    return el('div', { class: 'row row-talent' }, [
      el('span', { class: 'row-label' }, [t('talent')]),
      el('span', { class: 'fixed-stat' }, [tTalent(weapon.talent.name)]),
    ]);
  }
  const slug = weapon.talent.slug;
  const pool = data.weaponTalents.filter((tl) => tl.compatibility.includes(slug));
  if (!pool.length) return null;
  return el('div', { class: 'row row-talent' }, [
    el('span', { class: 'row-label' }, [t('talent')]),
    select(
      build().weapons[slot].talent,
      pool.map((tl) => [tl.name, tTalent(tl.name)] as [string, string]),
      (v) => update('summary', (b) => { b.weapons[slot].talent = v || null; }),
      '—',
    ),
  ]);
}

function slotCard(data: GameData, attrs: Map<string, AttributeDef>, slot: WeaponSlot) {
  const state = build().weapons[slot];
  const weapon = state.weaponId ? data.weapons.find((w) => w.id === state.weaponId) ?? null : null;

  const rows: (Node | null)[] = [];
  if (weapon) {
    weapon.cores.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'cores', i, spec, t('core'))));
    weapon.minors.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'minors', i, spec, t('attribute'))));
    weapon.mods.forEach((spec, i) => rows.push(modRow(data, slot, i, spec)));
    rows.push(talentRow(data, slot, weapon));
  }

  return el('section', { class: `slot-card${weapon ? '' : ' is-empty'}` }, [
    el('header', {}, [
      el('h3', {}, [tWeaponSlot(slot)]),
      weapon ? el('span', { class: `pill q-${quality(weapon)}` }, [tQuality(quality(weapon))]) : null,
    ]),
    select(state.weaponId, weaponOptions(data, slot), (v) =>
      update('gear', (b) => {
        if (!v) { b.weapons[slot] = { weaponId: null, cores: [], minors: [], mods: [], talent: null }; return; }
        const picked = data.weapons.find((w) => w.id === v)!;
        b.weapons[slot] = { weaponId: v, ...defaultsFor(picked, attrs) };
      }), t('empty')),
    weapon
      ? el('p', { class: 'weapon-base' }, [
          [
            weapon.baseDamage !== null ? `${t('baseDamage')} ${Math.round(weapon.baseDamage).toLocaleString('en-US')}` : null,
            weapon.rpm !== null ? `${weapon.rpm} RPM` : null,
            weapon.magSize !== null ? `${t('magazine')} ${weapon.magSize}` : null,
            weapon.reloadTime !== null ? `${t('reload')} ${weapon.reloadTime}s` : null,
          ].filter(Boolean).join('　'),
        ])
      : null,
    ...rows,
  ]);
}

export function renderWeaponPanel(root: HTMLElement, data: GameData) {
  const attrs = attributeIndex(data);
  clear(root);
  for (const slot of WEAPON_SLOTS) root.append(slotCard(data, attrs, slot));
}
