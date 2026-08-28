/**
 * 推薦套裝解析 / Resolves a recommended-build template into a concrete BuildState.
 *
 * Templates name sets rather than items, so this picks the generic piece of each
 * set per slot and fills cores and minors from the template's preferences.
 */
import type { AttributeDef, GameData, GearItem, GearSlot } from '../types.ts';
import { GEAR_SLOTS } from '../types.ts';
import type { BuildState, SlotChoice, SlotState } from '../build.ts';
import { emptyBuild } from '../build.ts';
import type { RecommendedBuild } from '../../data/recommended.ts';
import { attributeIndex, defaultChoicesFor, eligible } from './index.ts';

/**
 * Slots a four-piece set should claim first. Chest and backpack carry the
 * talents, so they go to the primary set before anything else.
 */
const SLOT_PRIORITY: GearSlot[] = ['chest', 'backpack', 'mask', 'gloves', 'holster', 'knees'];

/** The plain, non-named, non-exotic piece of a set in a slot. */
function genericPiece(data: GameData, slot: GearSlot, setName: string): GearItem | undefined {
  return data.gear[slot].find(
    (i) => (i.brandSet ?? i.gearSet) === setName && !i.isNamed && !i.isExotic,
  );
}

/** Fill a slot's choice slots from the template, keeping fixed rolls intact. */
function applyPreferences(
  item: GearItem,
  state: SlotState,
  data: GameData,
  attrs: Map<string, AttributeDef>,
  template: RecommendedBuild,
) {
  const preferStat = (choices: SlotChoice[], specs: typeof item.cores, wanted: string[]) => {
    const used = new Set<string>();
    specs.forEach((spec, i) => {
      if (spec.mode !== 'choice') return;
      const options = eligible(spec, data);
      for (const stat of wanted) {
        if (used.has(stat)) continue;
        const match = options.find((a) => a.statId === stat);
        if (!match) continue;
        choices[i] = { attributeId: match.id, value: match.max };
        used.add(stat);
        return;
      }
    });
  };

  preferStat(state.cores, item.cores, [template.core]);
  preferStat(state.minors, item.minors, template.minors);
  return state;
}

export interface ResolvedBuild {
  build: BuildState;
  /** Slots the template could not fill, e.g. a set with no piece for that slot. */
  unfilled: GearSlot[];
}

export function resolveRecommended(data: GameData, template: RecommendedBuild): ResolvedBuild {
  const attrs = attributeIndex(data);
  const build = emptyBuild();
  const taken = new Set<GearSlot>();

  for (const spec of template.sets) {
    let placed = 0;
    for (const slot of SLOT_PRIORITY) {
      if (placed >= spec.pieces) break;
      if (taken.has(slot)) continue;
      const item = genericPiece(data, slot, spec.name);
      if (!item) continue;
      const state: SlotState = { itemId: item.id, ...defaultChoicesFor(item, data, attrs) };
      build.gear[slot] = applyPreferences(item, state, data, attrs, template);
      taken.add(slot);
      placed += 1;
    }
  }

  return { build, unfilled: GEAR_SLOTS.filter((s) => !taken.has(s)) };
}
