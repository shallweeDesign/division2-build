/**
 * 套裝詳情 / Everything the loot popup shows about one brand or gear set:
 * its bonus tiers, the talents its pieces carry, and every piece by slot.
 *
 * Pure and data-only, so the popup stays a thin renderer and this is testable
 * against the real dataset.
 */
import { GEAR_SLOTS } from './types.ts';
import type { AttributeDef, Category, GameData, GearItem, GearSlot, SetDef, Value } from './types.ts';

/** The slice of the dataset the loot page loads; see `data/loot-data.ts`. */
export type SetData = Pick<GameData, 'sets' | 'gear' | 'attributes' | 'gearTalents' | 'stats'>;

/**
 * 名稱比對 / The loot source and the dataset differ in trailing punctuation —
 * "Walker, Harris & Co" against "Walker, Harris & Co.", "Legatus S.p.A."
 * against "Legatus S.p.A" — so names compare without it, case-insensitively.
 */
export const normName = (s: string) => s.trim().replace(/[.\s]+$/, '').toLowerCase();

export interface StatLine { statId: string; value: Value; category: Category | null }

export type TierEntryView =
  | ({ kind: 'stat' } & StatLine)
  | { kind: 'talent'; name: string; description: string | null };

/** Core slot: a fixed attribute, or the set's default core type. */
export type CoreView = ({ fixed: true } & StatLine) | { fixed: false; statId: string | null; category: Category | null };
/** Minor slot: a fixed (named) attribute at its fixed roll, or random. */
export type MinorView = ({ fixed: true } & StatLine) | { fixed: false };

export interface PieceView {
  item: GearItem;
  cores: CoreView[];
  minors: MinorView[];
  mods: number;
  talent: { fixed: true; name: string; description: string | null } | { fixed: false } | null;
}

export interface SetDetail {
  set: SetDef;
  coreCategory: Category | null;
  tiers: { pieces: number; entries: TierEntryView[] }[];
  /**
   * 部位天賦 / Gear sets weld a talent to the set's own chest and backpack
   * (shown under the 4-piece bonus in game). Brands leave those slots open.
   */
  slotTalents: { slot: GearSlot; name: string; description: string | null }[];
  pieces: { slot: GearSlot; items: PieceView[] }[];
}

/**
 * 屬性類別 / Category by stat. Taken from the attribute rows, which are the
 * only place the dataset records one; a stat that only ever appears in a set
 * bonus has none, and stays uncoloured rather than guessed.
 */
function categoryIndex(attrs: AttributeDef[]) {
  const m = new Map<string, Category>();
  for (const a of attrs) if (!m.has(a.statId)) m.set(a.statId, a.category);
  return m;
}

export function findSet(data: SetData, name: string): SetDef | null {
  const key = normName(name);
  return data.sets.find((s) => normName(s.name) === key) ?? null;
}

export function setDetail(data: SetData, name: string): SetDetail | null {
  const set = findSet(data, name);
  if (!set) return null;

  const cats = categoryIndex(data.attributes);
  const attrs = new Map(data.attributes.map((a) => [a.id, a]));
  const talentText = new Map(data.gearTalents.map((t) => [t.name, t.description || null]));
  const cat = (statId: string | null) => (statId ? cats.get(statId) ?? null : null);

  const fixedLine = (attributeId: string, value: Value | null): StatLine | null => {
    const a = attrs.get(attributeId);
    // A fixed attribute with no roll of its own sits at its maximum — that is
    // what makes a named piece's attribute worth farming.
    return a ? { statId: a.statId, value: value ?? a.max, category: a.category } : null;
  };

  const piece = (item: GearItem): PieceView => ({
    item,
    cores: item.cores.flatMap((c): CoreView[] => {
      if (c.mode === 'fixed') {
        const line = fixedLine(c.attributeId, c.value);
        return line ? [{ fixed: true, ...line }] : [];
      }
      return c.mode === 'choice'
        ? [{ fixed: false, statId: set.defaultCoreStatId, category: cat(set.defaultCoreStatId) }]
        : [];
    }),
    minors: item.minors.flatMap((m): MinorView[] => {
      if (m.mode === 'fixed') {
        const line = fixedLine(m.attributeId, m.value);
        return line ? [{ fixed: true, ...line }] : [];
      }
      return m.mode === 'choice' ? [{ fixed: false }] : [];
    }),
    mods: item.mods.filter((m) => m.mode !== 'none').length,
    talent: item.talent === null ? null
      : item.talent.mode === 'fixed'
        ? { fixed: true, name: item.talent.name, description: talentText.get(item.talent.name) ?? null }
        : { fixed: false },
  });

  const owns = (i: GearItem) => (set.kind === 'brand' ? i.brandSet : i.gearSet) === set.name;

  const pieces = GEAR_SLOTS.map((slot) => ({
    slot,
    // The plain piece first, then the named ones — the order the game lists them.
    items: data.gear[slot].filter(owns)
      .sort((a, b) => Number(a.isNamed) - Number(b.isNamed) || a.name.localeCompare(b.name))
      .map(piece),
  })).filter((p) => p.items.length > 0);

  const slotTalents = set.kind === 'gearset'
    ? pieces.flatMap(({ slot, items }) => {
      const t = items.find((p) => !p.item.isNamed)?.talent;
      return t?.fixed ? [{ slot, name: t.name, description: t.description }] : [];
    })
    : [];

  return {
    set,
    coreCategory: cat(set.defaultCoreStatId),
    tiers: set.tiers.map((tier) => ({
      pieces: tier.pieces,
      entries: tier.entries.map((e): TierEntryView => (e.kind === 'stat'
        ? { kind: 'stat', statId: e.statId, value: e.value, category: cat(e.statId) }
        : { kind: 'talent', name: e.name, description: talentText.get(e.name) ?? null })),
    })),
    slotTalents,
    pieces,
  };
}
