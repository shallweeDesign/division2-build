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
import { t, tQuality, tStat, tTalent, tTalentText, tWeapon, tWeaponSlot, tWeaponType } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el, select } from './dom.ts';

const quality = (w: Weapon) => (w.isExotic ? 'exotic' : w.isNamed ? 'named' : 'high-end');
const rank = (w: Weapon) => (w.isExotic ? 2 : w.isNamed ? 1 : 0);

const fmtValue = (v: Value | null) => (v === null ? '' : v.percent ? `${v.n}%` : String(v.n));

/** Only pistols go in the sidearm hand; everything else is a main weapon. */
const fits = (w: Weapon, slot: WeaponSlot) =>
  slot === 'sidearm' ? w.slotType === 'sidearm' : w.slotType === 'main';

/**
 * 種類／型號的暫存選擇 / Type and model picked before a weapon is.
 *
 * The build only stores a weapon id, so the first two levels of the cascade
 * live here until a weapon is chosen; after that they are read off the weapon.
 */
const picking: Partial<Record<WeaponSlot, { type: string | null; family: string | null }>> = {};

const uniq = (xs: string[]) => [...new Set(xs)];

/** 奇特武器自成一組 / Exotics sit in their own group after the models, as on the gear cards. */
const EXOTIC = '__exotic__';
const familyOf = (w: Weapon) => (w.isExotic ? EXOTIC : w.family);

/** 種類 → 型號 → 名稱 / The three cascading selects at the top of a card. */
function weaponPickers(data: GameData, attrs: Map<string, AttributeDef>, slot: WeaponSlot, weapon: Weapon | null) {
  const pool = data.weapons.filter((w) => fits(w, slot));
  const type = weapon?.weaponType ?? picking[slot]?.type ?? null;
  const family = (weapon && familyOf(weapon)) ?? picking[slot]?.family ?? null;

  const equip = (w: Weapon | null) => update('gear', (b) => {
    b.weapons[slot] = w
      ? { weaponId: w.id, ...defaultsFor(w, attrs) }
      : { weaponId: null, cores: [], minors: [], mods: [], talent: null };
  });
  const choose = (next: { type: string | null; family: string | null }) => {
    picking[slot] = next;
    const kin = pool.filter((w) => w.weaponType === next.type && familyOf(w) === next.family);
    // A model with a single weapon has nothing left to choose.
    equip(kin.length === 1 ? kin[0]! : null);
  };

  const types = uniq(pool.map((w) => w.weaponType))
    .sort((a, b) => (TYPE_ORDER[a] ?? 99) - (TYPE_ORDER[b] ?? 99));
  const families = type
    ? uniq(pool.filter((w) => w.weaponType === type).map(familyOf))
      .sort((a, b) => Number(a === EXOTIC) - Number(b === EXOTIC) || a.localeCompare(b))
    : [];
  const names = type && family
    ? pool.filter((w) => w.weaponType === type && familyOf(w) === family)
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    : [];

  const row = (label: Parameters<typeof t>[0], control: HTMLElement) =>
    el('div', { class: 'row row-pick' }, [el('span', { class: 'row-label' }, [t(label)]), control]);

  return [
    row('weaponKind', select(type, types.map((x) => [x, tWeaponType(x)]),
      (v) => choose({ type: v || null, family: null }), t('empty'))),
    row('model', select(family, families.map((x) => [x, x === EXOTIC ? tQuality('exotic') : x]),
      (v) => choose({ type, family: v || null }), '—')),
    row('weaponName', select(weapon?.id ?? null,
      names.map((w) => [w.id, w.isNamed ? `${tWeapon(w.name)}（${tQuality(quality(w))}）` : tWeapon(w.name)]),
      (v) => equip(names.find((w) => w.id === v) ?? null), '—')),
  ];
}

/** Display order of weapon types, as in the game's inventory. */
const TYPE_ORDER: Record<string, number> = {
  'Assault Rifle': 0, SMG: 1, LMG: 2, Rifle: 3, 'Marksman Rifle': 4, Shotgun: 5, Pistol: 6,
};

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

/** 天賦＋天賦內容 / The talent, then its wording beneath. */
function talentRows(data: GameData, slot: WeaponSlot, weapon: Weapon) {
  if (!weapon.talent) return [];
  const text = (name: string | null) => {
    const d = name ? data.weaponTalents.find((tl) => tl.name === name)?.description : null;
    return d && name ? el('p', { class: 'talent-text' }, [tTalentText(name, d)]) : null;
  };
  if (weapon.talent.mode === 'fixed') {
    return [
      el('div', { class: 'row row-talent' }, [
        el('span', { class: 'row-label' }, [t('fixedTalent')]),
        el('span', { class: 'fixed-stat' }, [tTalent(weapon.talent.name)]),
      ]),
      text(weapon.talent.name),
    ];
  }
  const slug = weapon.talent.slug;
  const pool = data.weaponTalents.filter((tl) => tl.compatibility.includes(slug));
  if (!pool.length) return [];
  const chosen = build().weapons[slot].talent;
  return [
    el('div', { class: 'row row-talent' }, [
      el('span', { class: 'row-label' }, [t('talent')]),
      select(
        chosen,
        pool.map((tl) => [tl.name, tTalent(tl.name)] as [string, string]),
        // 'gear' rather than 'summary' so the wording below follows the pick.
        (v) => update('gear', (b) => { b.weapons[slot].talent = v || null; }),
        '—',
      ),
    ]),
    text(chosen),
  ];
}

function slotCard(data: GameData, attrs: Map<string, AttributeDef>, slot: WeaponSlot) {
  const state = build().weapons[slot];
  const weapon = state.weaponId ? data.weapons.find((w) => w.id === state.weaponId) ?? null : null;

  const rows: (Node | null)[] = [];
  if (weapon) {
    weapon.cores.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'cores', i, spec, t('core'))));
    weapon.minors.forEach((spec, i) => rows.push(attributeRow(data, attrs, slot, 'minors', i, spec, t('attribute'))));
    weapon.mods.forEach((spec, i) => rows.push(modRow(data, slot, i, spec)));
  }

  return el('section', { class: `slot-card${weapon ? '' : ' is-empty'}` }, [
    el('header', {}, [
      el('h3', {}, [tWeaponSlot(slot)]),
      weapon ? el('span', { class: `pill q-${quality(weapon)}` }, [tQuality(quality(weapon))]) : null,
    ]),
    ...weaponPickers(data, attrs, slot, weapon),
    ...(weapon ? talentRows(data, slot, weapon) : []),
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
