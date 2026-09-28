/**
 * 技能 / Pick the two skills and see what the build gives them.
 *
 * Variants are grouped under their parent skill, the way the game's skill
 * wheel reads. A parent already in the other slot is disabled rather than
 * hidden: the game allows one variant per skill, and a greyed-out entry says
 * why it cannot be picked where a missing one would just look like a gap.
 *
 * No skill's own numbers appear here because the dataset has none — see
 * `calc/skills.ts`. The panel says so in plain words instead of leaving the
 * player to wonder where the turret damage went.
 */
import type { GameData } from '../model/types.ts';
import { computeSkills } from '../model/calc/skills.ts';
import type { StatTotal } from '../model/calc/index.ts';
import { SKILL_TIER_CAP } from '../model/calc/constants.ts';
import { t, tSkill, tStat } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el } from './dom.ts';

function picker(data: GameData, slot: number) {
  const chosen = build().skills[slot] ?? null;
  const parentOf = new Map(data.skills.map((v) => [v.name, v.skill]));
  const taken = new Set(build().skills
    .filter((n, i) => i !== slot && n)
    .map((n) => parentOf.get(n!)));

  const groups = new Map<string, string[]>();
  for (const v of data.skills) groups.set(v.skill, [...(groups.get(v.skill) ?? []), v.name]);

  const s = el('select', {
    onchange: (e) => update('summary', (b) => { b.skills[slot] = (e.target as HTMLSelectElement).value || null; }),
  });
  s.append(el('option', { value: '' }, [t('empty')]));
  for (const [parent, variants] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const group = el('optgroup', { label: tSkill(parent) });
    for (const name of variants) {
      group.append(el('option', { value: name, disabled: taken.has(parent) }, [tSkill(name)]));
    }
    s.append(group);
  }
  s.value = chosen ?? '';
  return s;
}

function statRow(s: StatTotal, name: (id: string) => string) {
  const n = Math.round(s.value * 10) / 10;
  return el('li', { class: n === 0 ? 'is-zero' : '', title: s.contributions.map((c) => `${c.source}: ${c.value}`).join('\n') }, [
    el('span', {}, [name(s.statId)]),
    el('strong', {}, [`${n > 0 ? '+' : ''}${n}${s.percent ? '%' : ''}`]),
  ]);
}

export function renderSkillPanel(root: HTMLElement, data: GameData) {
  clear(root);
  const { tier, equipped, stats, warnings } = computeSkills(data, build());
  const statName = new Map(data.stats.map((s) => [s.id, s.name]));
  const name = (id: string) => tStat(id, statName.get(id) ?? id);

  const pips = Array.from({ length: SKILL_TIER_CAP }, (_, i) =>
    el('span', { class: `skill-pip${i < tier.value ? ' is-on' : ''}` }));

  root.append(el('section', { class: 'panel skills' }, [
    el('h2', {}, [t('skills')]),
    el('div', { class: 'skill-slots' }, equipped.map((e, i) =>
      el('div', { class: 'skill-slot' }, [
        el('label', { class: 'skill-label' }, [t('skillSlot').replace('{n}', String(i + 1))]),
        picker(data, i),
        e?.specific.length
          ? el('ul', { class: 'skill-specific' }, [
              el('li', { class: 'muted' }, [t('skillOnly')]),
              ...e.specific.map((s) => statRow(s, name)),
            ])
          : null,
      ]))),
    el('div', { class: 'skill-tier' }, [
      el('span', {}, [t('skillTier')]),
      el('span', { class: 'skill-pips' }, pips),
      el('strong', {}, [`${tier.value} / ${SKILL_TIER_CAP}`]),
    ]),
    tier.wasted > 0
      ? el('p', { class: 'skill-wasted' }, [t('skillTierWasted').replace('{n}', String(tier.wasted))])
      : null,
    el('h3', {}, [t('skillBonuses')]),
    el('ul', { class: 'skill-stats' }, stats.map((s) => statRow(s, name))),
    ...warnings.map((w) => el('p', { class: 'skill-wasted' }, [w])),
    el('p', { class: 'muted skill-note' }, [t('skillNoNumbers')]),
  ]));
}
