/**
 * 傷害計算 / Damage per shot, and the DPS that follows from it.
 *
 * The chain, which three community write-ups agree on:
 *
 *   base
 *     × (1 + weapon damage + damage for this weapon's type)   ← one additive pool
 *     × (1 + total weapon damage)                             ← its own multiplier
 *     × [crit / headshot]
 *     × (1 + damage out of cover)
 *     × (1 + damage to armor  |  damage to health)            ← whichever phase
 *
 * Two things this deliberately does not do.
 *
 * `Total Weapon Damage` is a real and separate multiplier, and the reason
 * talents matter, but no stat in the data set carries it — it exists only in
 * talent wording. It is therefore always 1 here, and `twdApplied` says so, so
 * the number is understood as "before talents" rather than quietly wrong.
 *
 * Damage to armor and damage to health are alternatives, not a product: one
 * applies while a target still has armor, the other after. They are reported
 * as two columns rather than multiplied together.
 *
 * Sources agree on everything above except one case — see `HEADSHOT_CRIT`.
 */
import type { GameData, Weapon } from '../types.ts';
import type { StatTotal } from './index.ts';

/**
 * 爆頭爆擊的算法 / How a headshot that also crits combines.
 *
 * Sources conflict. mein-mmo puts crit and headshot in one bracket, making
 * them additive with each other; another write-up applies them as separate
 * multipliers; a third names the stage but declines to say. The difference is
 * not small — at +60% crit damage and +100% headshot damage it is ×2.6 against
 * ×3.2, some 23%.
 *
 * The additive reading is used because two of the three lean that way and it
 * is the conservative one: it understates rather than overstates. This is the
 * only cell of the eight affected, and the UI labels it.
 */
export const HEADSHOT_CRIT: 'additive' | 'multiplicative' = 'additive';

/** 武器類型對應的傷害屬性 / `Assault Rifle` → `assault-rifle-damage`. */
export const typeDamageStat = (weaponType: string) =>
  `${weaponType.toLowerCase().replace(/\s+/g, '-')}-damage`;

export interface DamageCell {
  /** 對裝甲 / While the target still has armor. */
  armor: number;
  /** 對生命值 / After the armor is gone. */
  health: number;
}

export interface DamageNumbers {
  bodyNonCrit: DamageCell;
  bodyCrit: DamageCell;
  headshotNonCrit: DamageCell;
  headshotCrit: DamageCell;
}

export interface DpsNumbers {
  /** 平均每發，含爆擊期望值 / Expected damage of one body shot. */
  averageShot: number;
  /** 不含換彈 / Firing without reloading. */
  burst: number;
  /** 含換彈 / Averaged over reloads. */
  sustained: number;
  damagePerMag: number;
}

export interface WeaponDamage {
  base: { numbers: DamageNumbers; dps: DpsNumbers };
  withBuild: { numbers: DamageNumbers; dps: DpsNumbers };
  /** The multipliers that produced `withBuild`, for showing the reader the work. */
  parts: {
    weaponPool: number;
    crit: { chance: number; damage: number };
    headshot: number;
    outOfCover: number;
    toArmor: number;
    toHealth: number;
  };
  /** False while no stat in the data set carries Total Weapon Damage. */
  twdApplied: boolean;
}

const pct = (stats: StatTotal[], id: string) => (stats.find((s) => s.statId === id)?.value ?? 0) / 100;

function numbers(base: number, pool: number, chc: number, chd: number, hsd: number,
                 dtooc: number, dta: number, dth: number): DamageNumbers {
  const core = base * (1 + pool) * (1 + dtooc);
  const cell = (mult: number): DamageCell => ({
    armor: core * mult * (1 + dta),
    health: core * mult * (1 + dth),
  });
  const headCrit = HEADSHOT_CRIT === 'additive' ? 1 + chd + hsd : (1 + chd) * (1 + hsd);
  void chc;                                    // discrete cells are a given hit, not an average
  return {
    bodyNonCrit: cell(1),
    bodyCrit: cell(1 + chd),
    headshotNonCrit: cell(1 + hsd),
    headshotCrit: cell(headCrit),
  };
}

function dps(weapon: Weapon, perShotHealth: number, chc: number, chd: number): DpsNumbers {
  const rps = (weapon.rpm ?? 0) / 60;
  const mag = weapon.magSize ?? 0;
  const reload = weapon.reloadTime ?? 0;
  // Expected damage of a shot, crit weighted by how often it happens.
  const averageShot = perShotHealth * (1 + chc * chd);
  const emptyTime = rps > 0 ? mag / rps : 0;
  return {
    averageShot,
    burst: averageShot * rps,
    sustained: emptyTime + reload > 0 ? (averageShot * mag) / (emptyTime + reload) : 0,
    damagePerMag: averageShot * mag,
  };
}

/**
 * 一把武器的傷害 / Damage for one weapon, before and after the build.
 *
 * `stats` are that weapon's totals from `computeWeapon` — gear, sets and watch
 * plus the weapon's own cores, attributes and parts.
 */
export function weaponDamage(data: GameData, weapon: Weapon, stats: StatTotal[]): WeaponDamage | null {
  if (weapon.baseDamage === null) return null;

  // Only the pool for this weapon's own type counts: SMG damage on a chest
  // piece does nothing while an assault rifle is in your hands.
  const pool = pct(stats, 'weapon-damage') + pct(stats, typeDamageStat(weapon.weaponType));
  const chc = Math.min(pct(stats, 'critical-hit-chance'), 0.6);
  const chd = pct(stats, 'critical-hit-damage');
  // The weapon's own headshot multiplier is a flat number, not a percent stat.
  const hsd = (weapon.headshotDamage?.n ?? 0) / 100 + pct(stats, 'headshot-damage');
  const dtooc = pct(stats, 'dtoc');
  const dta = pct(stats, 'damage-to-armor');
  const dth = pct(stats, 'health-damage');

  const baseNums = numbers(weapon.baseDamage, 0, 0, 0, (weapon.headshotDamage?.n ?? 0) / 100, 0, 0, 0);
  const buildNums = numbers(weapon.baseDamage, pool, chc, chd, hsd, dtooc, dta, dth);

  void data;
  return {
    base: {
      numbers: baseNums,
      dps: dps(weapon, baseNums.bodyNonCrit.health, 0, 0),
    },
    withBuild: {
      numbers: buildNums,
      dps: dps(weapon, buildNums.bodyNonCrit.health, chc, chd),
    },
    parts: { weaponPool: pool, crit: { chance: chc, damage: chd }, headshot: hsd, outOfCover: dtooc, toArmor: dta, toHealth: dth },
    twdApplied: false,
  };
}
