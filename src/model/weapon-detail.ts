/**
 * 武器類別詳情 / What a weapon-class loot target can drop: every weapon of that
 * class, exotics first, then named, then the regular ones.
 *
 * The loot source names classes loosely and in two forms — `Pistol` / `SMG`
 * as mission targets, `MMRs` / `Assault Rifles` in the vendor caches — and
 * `loot-vocab.ts` maps both onto the dataset's own `weaponType`.
 */
import type { Weapon } from './types.ts';
import { fixedLineFor } from './set-detail.ts';
import { resolveLoot } from './loot-vocab.ts';
import type { CoreView, MinorView, SetData } from './set-detail.ts';

/** 對應武器類別 / The dataset's `weaponType` for a loot word, or null. */
export const weaponClassOf = (name: string): string | null => {
  const ref = resolveLoot(name);
  return ref.kind === 'weapon' ? ref.weaponType : null;
};

export type WeaponTier = 'exotic' | 'named' | 'regular';

export interface WeaponView {
  weapon: Weapon;
  cores: CoreView[];
  minors: MinorView[];
  talent: { fixed: true; name: string; description: string | null } | { fixed: false } | null;
}

export interface WeaponDetail {
  weaponType: string;
  groups: { tier: WeaponTier; weapons: WeaponView[] }[];
}

const tierOf = (w: Weapon): WeaponTier => (w.isExotic ? 'exotic' : w.isNamed ? 'named' : 'regular');
const ORDER: WeaponTier[] = ['exotic', 'named', 'regular'];

export function weaponDetail(data: SetData, name: string): WeaponDetail | null {
  const weaponType = weaponClassOf(name);
  if (!weaponType) return null;

  const fixedLine = fixedLineFor(data.attributes);
  const talentText = new Map(data.weaponTalents.map((t) => [t.name, t.description || null]));

  const view = (weapon: Weapon): WeaponView => ({
    weapon,
    cores: weapon.cores.flatMap((c): CoreView[] => {
      if (c.mode !== 'fixed') return [];
      const line = fixedLine(c.attributeId, c.value);
      return line ? [{ fixed: true, ...line }] : [];
    }),
    minors: weapon.minors.flatMap((m): MinorView[] => {
      if (m.mode === 'fixed') {
        const line = fixedLine(m.attributeId, m.value);
        return line ? [{ fixed: true, ...line }] : [];
      }
      return m.mode === 'choice' ? [{ fixed: false }] : [];
    }),
    talent: weapon.talent === null ? null
      : weapon.talent.mode === 'fixed'
        ? { fixed: true, name: weapon.talent.name, description: talentText.get(weapon.talent.name) ?? null }
        : { fixed: false },
  });

  const all = data.weapons.filter((w) => w.weaponType === weaponType);
  const groups = ORDER.map((tier) => ({
    tier,
    // Grouped by family within a tier, so a named variant sits with its kin.
    weapons: all.filter((w) => tierOf(w) === tier)
      .sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name))
      .map(view),
  })).filter((g) => g.weapons.length > 0);

  return { weaponType, groups };
}
