/**
 * 傷害面板 / What each weapon actually hits for.
 *
 * One tab per equipped weapon, because the numbers are per weapon: gear
 * applies to whatever you hold, but a weapon's own cores and parts do not.
 *
 * Two things are stated on the page rather than buried in a comment. Total
 * Weapon Damage is missing from the data set, so these are pre-talent figures.
 * And the headshot-crit cells rest on a reading the sources disagree about.
 * A calculator that hides either would be claiming more than it knows.
 */
import type { GameData, WeaponSlot } from '../model/types.ts';
import { WEAPON_SLOTS } from '../model/types.ts';
import { computeWeapon } from '../model/calc/index.ts';
import { HEADSHOT_CRIT, weaponDamage } from '../model/calc/damage.ts';
import type { DamageNumbers, DpsNumbers } from '../model/calc/damage.ts';
import { t, tWeaponSlot } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el } from './dom.ts';

/** Which weapon's numbers are on screen; kept here since it is a view concern. */
let active: WeaponSlot = 'primary';

const n0 = (n: number) => Math.round(n).toLocaleString('en-US');

const HITS: [keyof DamageNumbers, string][] = [
  ['bodyNonCrit', 'hitBody'],
  ['bodyCrit', 'hitBodyCrit'],
  ['headshotNonCrit', 'hitHead'],
  ['headshotCrit', 'hitHeadCrit'],
];

function dpsRow(label: string, d: DpsNumbers, muted: boolean) {
  const fig = (v: number, key: string) =>
    el('div', { class: 'dps-fig' }, [
      el('strong', {}, [n0(v)]),
      el('span', {}, [t(key as Parameters<typeof t>[0])]),
    ]);
  return el('div', { class: `dps-row${muted ? ' is-base' : ''}` }, [
    el('span', { class: 'dps-label' }, [label]),
    el('div', { class: 'dps-figs' }, [
      fig(d.burst, 'burstDps'),
      fig(d.sustained, 'sustainedDps'),
      fig(d.damagePerMag, 'dmgPerMag'),
      fig(d.averageShot, 'avgShot'),
    ]),
  ]);
}

export function renderDamagePanel(root: HTMLElement, data: GameData) {
  clear(root);

  const equipped = WEAPON_SLOTS.filter((s) => build().weapons[s].weaponId);
  if (!equipped.length) {
    root.append(el('section', { class: 'panel' }, [
      el('h2', {}, [t('damage')]),
      el('p', { class: 'muted' }, [t('noWeapon')]),
    ]));
    return;
  }
  if (!equipped.includes(active)) active = equipped[0]!;

  const totals = computeWeapon(data, build(), active);
  const dmg = totals && weaponDamage(data, totals.weapon, totals.stats);

  const tabs = el('div', { class: 'dmg-tabs' }, equipped.map((s) =>
    el('button', {
      class: `dmg-tab${s === active ? ' is-active' : ''}`,
      onclick: () => { active = s; update('summary', () => {}); },
    }, [tWeaponSlot(s)])));

  if (!dmg || !totals) {
    root.append(el('section', { class: 'panel' }, [el('h2', {}, [t('damage')]), tabs,
      el('p', { class: 'muted' }, [t('noBaseDamage')])]));
    return;
  }

  const matrix = el('table', { class: 'dmg-table' }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, ['']),
      el('th', {}, [t('vsArmor')]),
      el('th', {}, [t('vsHealth')]),
    ])]),
    el('tbody', {}, HITS.map(([key, label]) =>
      el('tr', { class: key.startsWith('headshot') ? 'is-head' : '' }, [
        el('th', {}, [
          t(label as Parameters<typeof t>[0]),
          key === 'headshotCrit' ? el('sup', { class: 'caveat', title: t('headCritNote') }, ['*']) : null,
        ]),
        el('td', {}, [n0(dmg.withBuild.numbers[key].armor)]),
        el('td', {}, [n0(dmg.withBuild.numbers[key].health)]),
      ]))),
  ]);

  const w = totals.weapon;
  root.append(el('section', { class: 'panel damage' }, [
    el('h2', {}, [t('damage')]),
    tabs,
    el('p', { class: 'weapon-base' }, [
      [w.name, w.rpm !== null ? `${w.rpm} RPM` : null,
       w.magSize !== null ? `${t('magazine')} ${w.magSize}` : null].filter(Boolean).join('　'),
    ]),

    el('h3', {}, [t('dpsOverview')]),
    dpsRow(t('baseOnly'), dmg.base.dps, true),
    dpsRow(t('withBuild'), dmg.withBuild.dps, false),

    el('h3', {}, [t('damageNumbers')]),
    el('div', { class: 'table-scroll' }, [matrix]),

    el('p', { class: 'muted caveat-note' }, [
      dmg.twdApplied ? '' : t('twdMissing'),
      ' ',
      HEADSHOT_CRIT === 'additive' ? t('headCritNote') : '',
    ]),
  ]));
}
