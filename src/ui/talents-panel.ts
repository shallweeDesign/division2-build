/**
 * 天賦一覽 / Every talent with its wording, for reading rather than building.
 *
 * Three sub-tabs on a hash route — weapons, gear, specializations — each
 * grouped the way a player meets them: talents you pick, then those that come
 * fixed on a named or exotic item (or with a gear set). A search box filters
 * the current tab by name, item or wording, in either language.
 *
 * Specialization talents have no Chinese wording yet, so they show in English.
 */
import type { GameData, GearItem, SpecializationId, Weapon } from '../model/types.ts';
import { GEAR_LAYOUT } from '../model/types.ts';
import { lang, t, tItem, tSet, tSlot, tSpec, tTalent, tTalentText, tWeapon, tWeaponType } from '../i18n/index.ts';
import { el } from './dom.ts';

/** 相容代碼 / The dataset's compatibility slugs, as weapon types or gear slots. */
const SLUG_TYPE: Record<string, string> = {
  'assault-rifle': 'Assault Rifle', smg: 'SMG', lmg: 'LMG', rifle: 'Rifle',
  'marksman-rifle': 'Marksman Rifle', shotgun: 'Shotgun', pistol: 'Pistol',
};
const slugLabel = (s: string) =>
  SLUG_TYPE[s] ? tWeaponType(SLUG_TYPE[s]!) : (GEAR_LAYOUT as readonly string[]).includes(s) ? tSlot(s as 'chest') : s;

interface Entry {
  name: string;
  /** Already in the active language. */
  title: string;
  /** The English name under a Chinese one; empty in English. */
  sub: string;
  source: string;
  text: string;
}

function talentEntry(name: string, en: string | undefined, source: string): Entry {
  const title = tTalent(name);
  return { name, title, sub: title === name ? '' : name, source, text: en ? tTalentText(name, en) : t('noTalentText') };
}

function card(e: Entry) {
  const li = el('li', {}, [
    el('div', { class: 'talent-head' }, [
      el('strong', {}, [e.title, e.sub ? el('small', {}, [e.sub]) : null]),
      e.source ? el('span', { class: 'talent-source' }, [e.source]) : null,
    ]),
    el('p', { class: 'talent-desc' }, [e.text]),
  ]);
  li.dataset.search = [e.name, e.title, e.source, e.text].join(' ').toLowerCase();
  return li;
}

function group(title: string, entries: Entry[], note?: string) {
  if (!entries.length) return null;
  return el('section', { class: 'panel talent-group' }, [
    el('h2', { class: 'col-heading' }, [title, el('span', { class: 'talent-count' }, [String(entries.length)])]),
    note ? el('p', { class: 'muted' }, [note]) : null,
    el('ul', { class: 'talent-list' }, entries.map(card)),
  ]);
}

const sortByTitle = (a: Entry, b: Entry) => a.title.localeCompare(b.title, lang() === 'zh-tw' ? 'zh-Hant' : 'en');

/** 固定天賦 / Talents fixed on items, each listing the items that carry it. */
function fixedOn<T extends { name: string; talent: Weapon['talent'] | GearItem['talent'] }>(
  items: T[], label: (i: T) => string, describe: (n: string) => string | undefined,
) {
  const by = new Map<string, string[]>();
  for (const i of items) {
    if (i.talent?.mode !== 'fixed') continue;
    const list = by.get(i.talent.name) ?? [];
    list.push(label(i));
    by.set(i.talent.name, list);
  }
  return [...by].map(([n, on]) => talentEntry(n, describe(n), [...new Set(on)].join('、'))).sort(sortByTitle);
}

function weaponTab(data: GameData) {
  const text = (n: string) => data.weaponTalents.find((x) => x.name === n)?.description;
  const pickable = data.weaponTalents
    .filter((x) => x.compatibility.length)
    .map((x) => talentEntry(x.name, x.description, x.compatibility.length === 7 ? t('talentsAllWeapons') : x.compatibility.map(slugLabel).join('、')))
    .sort(sortByTitle);
  return [
    group(t('talentsPickable'), pickable),
    group(t('talentsNamedWeapons'), fixedOn(data.weapons.filter((w) => w.isNamed && !w.isExotic), (w) => tWeapon(w.name), text)),
    group(t('talentsExoticWeapons'), fixedOn(data.weapons.filter((w) => w.isExotic), (w) => tWeapon(w.name), text)),
  ];
}

function gearTab(data: GameData) {
  const text = (n: string) => data.gearTalents.find((x) => x.name === n)?.description;
  const all = GEAR_LAYOUT.flatMap((slot) => data.gear[slot]);
  const pickable = data.gearTalents
    .filter((x) => x.compatibility.length)
    .map((x) => talentEntry(x.name, x.description, x.compatibility.map(slugLabel).join('、')))
    .sort(sortByTitle);

  // 套裝 / Each gear set's four-piece talent, then the chest's and backpack's.
  const sets = data.sets.filter((s) => s.kind === 'gearset').flatMap((s) => {
    const four = s.tiers.flatMap((tier) => tier.entries).find((e) => e.kind === 'talent');
    const pieceTalent = (slot: 'chest' | 'backpack') => {
      const i = data.gear[slot].find((g) => g.gearSet === s.name && g.talent?.mode === 'fixed');
      return i?.talent?.mode === 'fixed' ? talentEntry(i.talent.name, text(i.talent.name), `${tSet(s.name)} · ${tSlot(slot)}`) : null;
    };
    return [
      four?.kind === 'talent' ? talentEntry(four.name, text(four.name), `${tSet(s.name)} · ${t('talentsFourPiece')}`) : null,
      pieceTalent('chest'),
      pieceTalent('backpack'),
    ].filter((e): e is Entry => e !== null);
  });

  const item = (g: GearItem) => tItem(g.name, g.slot, g.brandSet ?? g.gearSet);
  return [
    group(t('talentsPickableGear'), pickable),
    group(t('talentsGearSets'), sets),
    group(t('talentsNamedGear'), fixedOn(all.filter((g) => g.isNamed && !g.isExotic), item, text)),
    group(t('talentsExoticGear'), fixedOn(all.filter((g) => g.isExotic), item, text)),
  ];
}

/** 專精 / Each specialization's talent nodes, tier by tier. */
function specTab(data: GameData) {
  return data.specializations.map((spec) => {
    const id = spec.id as SpecializationId;
    const prefix = `${id.charAt(0).toUpperCase()}${id.slice(1)} `;
    const entries = spec.nodes
      .filter((n) => n.category === 'talent')
      .map((n) => {
        const tiers = data.specTalents
          .filter((x) => x.name.startsWith(`${prefix}${n.name} Tier `))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const text = tiers.length > 1
          ? tiers.map((x) => `${x.name.match(/Tier (\d+)$/)?.[1] ?? ''}. ${x.description}`).join('\n')
          : tiers[0]?.description ?? t('noTalentText');
        return { name: n.name, title: n.name, sub: '', source: tiers.length > 1 ? fill(t('talentsTiers'), { n: String(tiers.length) }) : '', text };
      });
    return group(tSpec(id), entries, lang() === 'zh-tw' ? t('talentsSpecEnglish') : undefined);
  });
}

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

const TABS = [
  { id: 'weapon', label: () => t('weapons'), render: weaponTab },
  { id: 'gear', label: () => t('talentsGearTab'), render: gearTab },
  { id: 'spec', label: () => t('specialization'), render: specTab },
];

const current = () => TABS.find((tab) => tab.id === location.hash.slice(1)) ?? TABS[0]!;

let query = '';

/** 篩選 / Hide cards that do not match, and groups left empty. */
function applyFilter(body: HTMLElement) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  for (const g of body.querySelectorAll<HTMLElement>('.talent-group')) {
    let shown = 0;
    for (const li of g.querySelectorAll<HTMLElement>('.talent-list > li')) {
      const hit = words.every((w) => li.dataset.search!.includes(w));
      li.hidden = !hit;
      if (hit) shown++;
    }
    g.hidden = shown === 0;
  }
}

export function renderTalentsPanel(root: HTMLElement, data: GameData) {
  const active = current();
  const body = el('div', { class: 'talents-body' }, active.render(data));
  const search = el('input', {
    type: 'search', class: 'talents-search', value: query, placeholder: t('talentsSearch'),
    oninput: (e) => { query = (e.target as HTMLInputElement).value; applyFilter(body); },
  });
  root.replaceChildren(
    el('div', { class: 'talents-bar' }, [
      el('nav', { class: 'subtabs', 'aria-label': t('navTalents') }, TABS.map((tab) => el('a', {
        class: `subtab${tab === active ? ' active' : ''}`,
        href: `#${tab.id}`,
        'aria-current': tab === active ? 'page' : undefined,
      }, [tab.label()]))),
      search,
    ]),
    body,
  );
  applyFilter(body);
}
