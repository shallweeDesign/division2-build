/** 武器類別詳情 / The weapon-class popup, against the real dataset. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameData } from '../src/model/types.ts';
import { weaponClassOf, weaponDetail } from '../src/model/weapon-detail.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));

describe('weaponClassOf', () => {
  it('maps both the target and the vendor-cache wording', () => {
    expect(weaponClassOf('Pistol')).toBe('Pistol');
    expect(weaponClassOf('SMG')).toBe('SMG');
    expect(weaponClassOf('MMRs')).toBe('Marksman Rifle');
    expect(weaponClassOf('Assault Rifles')).toBe('Assault Rifle');
    expect(weaponClassOf('Rifles')).toBe('Rifle');
    expect(weaponClassOf('Shotguns')).toBe('Shotgun');
    expect(weaponClassOf('Chest Pieces')).toBeNull();
    expect(weaponClassOf('Hana-U Corporation')).toBeNull();
  });
});

describe('weaponDetail', () => {
  it('lists exotics, then named, then regular — and every weapon of the class', () => {
    const d = weaponDetail(data, 'Pistol')!;
    expect(d.groups.map((g) => g.tier)).toEqual(['exotic', 'named', 'regular']);
    expect(d.groups[0]!.weapons.every((v) => v.weapon.isExotic)).toBe(true);
    expect(d.groups[1]!.weapons.every((v) => v.weapon.isNamed && !v.weapon.isExotic)).toBe(true);
    expect(d.groups[2]!.weapons.every((v) => !v.weapon.isNamed && !v.weapon.isExotic)).toBe(true);
    const total = d.groups.reduce((n, g) => n + g.weapons.length, 0);
    expect(total).toBe(data.weapons.filter((w) => w.weaponType === 'Pistol').length);
  });

  it('gives every fixed talent its wording', () => {
    for (const cls of ['Pistol', 'SMG', 'MMRs', 'Assault Rifles', 'Rifles', 'Shotguns', 'LMGs']) {
      for (const g of weaponDetail(data, cls)!.groups) {
        for (const v of g.weapons) {
          if (v.talent?.fixed) expect(v.talent.description, `${v.weapon.name}: ${v.talent.name}`).toBeTruthy();
        }
      }
    }
  });

  it("shows a named weapon's fixed attributes and a regular one's random slot", () => {
    const d = weaponDetail(data, 'Pistol')!;
    const named = d.groups.find((g) => g.tier === 'named')!.weapons.find((v) => v.weapon.name === "Sharpshooter's 93R")!;
    expect(named.minors[0]).toMatchObject({ fixed: true });
    const plain = d.groups.find((g) => g.tier === 'regular')!.weapons.find((v) => v.weapon.name === '93R')!;
    expect(plain.cores[0]).toMatchObject({ fixed: true, statId: 'pistol-damage' });
    expect(plain.minors.some((m) => !m.fixed)).toBe(true);
  });

  it('returns null for a target that is not a weapon class', () => {
    expect(weaponDetail(data, 'Heartbreaker')).toBeNull();
  });
});
