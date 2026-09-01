/**
 * 專精 / Pick a specialization and the talents taken from its tree.
 *
 * The talents are grouped by the hub they hang from, which is how the tree
 * reads in game. Six nodes per specialization name no hub, but they are still
 * bought — "One in the Head" costs 3 points a tier for five tiers — so they
 * are grouped under a heading of their own and are just as selectable. The
 * ones with no talent rows behind them are equipment: the grenade, the spec
 * sidearm, the signature weapon. Those are listed, not offered.
 *
 * Only the talents whose wording reduced to numbers reach the totals. The rest
 * are shown with their text and counted as nothing, the same way gear talents
 * are, because "bonus armor gained while in cover" has no number in it until
 * someone models the condition.
 */
import type { GameData, SpecializationId, SpecTalent } from '../model/types.ts';
import { t, tSpec } from '../i18n/index.ts';
import { build, update } from './store.ts';
import { clear, el, select } from './dom.ts';

/** A tree node named `X` owns the talents called `<Spec> X Tier n`. */
function talentsOfNode(data: GameData, specId: SpecializationId, node: string): SpecTalent[] {
  const prefix = `${specId.charAt(0).toUpperCase()}${specId.slice(1)} ${node} Tier `;
  return data.specTalents
    .filter((tl) => tl.name.startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function talentRow(tl: SpecTalent) {
  const taken = build().spec.talents.includes(tl.name);
  const tier = tl.name.match(/Tier (\d+)$/)?.[1] ?? '';
  const box = el('input', {
    type: 'checkbox',
    checked: taken,
    onchange: (e) =>
      update('summary', (b) => {
        const on = (e.target as HTMLInputElement).checked;
        const set = new Set(b.spec.talents);
        if (on) set.add(tl.name); else set.delete(tl.name);
        b.spec.talents = [...set];
      }),
  });
  const effects = tl.effects.map((eff) =>
    `${eff.statId} ${eff.value.n > 0 ? '+' : ''}${eff.value.n}${eff.value.percent ? '%' : ''}` +
    (eff.weaponTypes.length ? `（${eff.weaponTypes.join('、')}）` : ''));

  return el('label', { class: `spec-talent${tl.effects.length ? '' : ' is-text-only'}` }, [
    box,
    el('span', { class: 'spec-tier' }, [tier]),
    el('span', { class: 'spec-desc' }, [tl.description]),
    effects.length
      ? el('span', { class: 'spec-effect' }, [effects.join('　')])
      : el('span', { class: 'spec-effect muted' }, [t('notCounted')]),
  ]);
}

export function renderSpecPanel(root: HTMLElement, data: GameData) {
  clear(root);
  const state = build().spec;
  const spec = state.id ? data.specializations.find((s) => s.id === state.id) ?? null : null;

  const picker = select(
    state.id,
    data.specializations.map((s) => [s.id, tSpec(s.id)] as [string, string]),
    (v) => update('gear', (b) => { b.spec = { id: (v || null) as SpecializationId | null, talents: [] }; }),
    t('empty'),
  );

  const body: (Node | null)[] = [];
  if (spec) {
    const hubs = spec.nodes.filter((n) => n.type === 'hub');
    for (const hub of hubs) {
      const children = spec.nodes.filter((n) => n.parent === hub.name);
      if (!children.length) continue;
      body.push(el('div', { class: 'spec-hub' }, [
        el('h3', {}, [hub.name, hub.budget !== null ? el('span', { class: 'spec-budget' }, [`${hub.budget} pts`]) : null]),
        ...children.flatMap((node) => {
          const talents = talentsOfNode(data, spec.id, node.name);
          if (!talents.length) return [];
          return [el('div', { class: 'spec-node' }, [
            el('h4', {}, [node.name]),
            ...talents.map(talentRow),
          ])];
        }),
      ]));
    }

    // Nodes that name no hub. They still cost points, so their talents are
    // selectable; the ones that are equipment have no talent rows and are
    // listed instead.
    const loose = spec.nodes.filter((n) => n.type === 'node' && n.parent === null);
    const withTalents = loose.map((n) => [n, talentsOfNode(data, spec.id, n.name)] as const)
      .filter(([, tl]) => tl.length > 0);
    const equipment = loose.filter((n) => !talentsOfNode(data, spec.id, n.name).length);

    if (withTalents.length || equipment.length) {
      body.push(el('div', { class: 'spec-hub' }, [
        el('h3', {}, [t('specStandalone')]),
        ...withTalents.map(([node, talents]) =>
          el('div', { class: 'spec-node' }, [el('h4', {}, [node.name]), ...talents.map(talentRow)])),
        equipment.length
          ? el('div', {}, [
              el('p', { class: 'muted spec-equip-note' }, [t('specEquipNote')]),
              el('ul', { class: 'spec-innate' }, equipment.map((n) => el('li', {}, [n.name]))),
            ])
          : null,
      ]));
    }
  }

  root.append(el('section', { class: 'panel spec' }, [
    el('h2', {}, [t('specialization')]),
    picker,
    ...body,
  ]));
}
