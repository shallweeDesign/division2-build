/** 裝備部位詳情 / The gear-cache popup, against the real dataset. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameData } from '../src/model/types.ts';
import { gearSlotDetail, gearSlotOf } from '../src/model/gear-slot-detail.ts';

const data: GameData = JSON.parse(readFileSync(new URL('../src/data/generated/game-data.json', import.meta.url), 'utf8'));

describe('gearSlotOf', () => {
  it('maps the vendor-cache wording seen so far, and the rest of the slots', () => {
    expect(gearSlotOf('Chest Pieces')).toBe('chest');
    expect(gearSlotOf('Backpacks')).toBe('backpack');
    expect(gearSlotOf('Gloves')).toBe('gloves');
    expect(gearSlotOf('Holsters')).toBe('holster');
    expect(gearSlotOf('Masks')).toBe('mask');
    expect(gearSlotOf('Kneepads')).toBe('knees');
    expect(gearSlotOf('MMRs')).toBeNull();
  });
});

describe('gearSlotDetail', () => {
  it('lists exotics then named — every one for the slot, and no plain pieces', () => {
    const d = gearSlotDetail(data, 'Chest Pieces')!;
    expect(d.groups.map((g) => g.tier)).toEqual(['exotic', 'named']);
    const exotics = d.groups[0]!.pieces.map((p) => p.piece.item);
    const named = d.groups[1]!.pieces.map((p) => p.piece.item);
    expect(exotics.every((i) => i.isExotic)).toBe(true);
    expect(named.every((i) => i.isNamed && !i.isExotic)).toBe(true);
    expect(exotics.length).toBe(data.gear.chest.filter((i) => i.isExotic).length);
    expect(named.length).toBe(data.gear.chest.filter((i) => i.isNamed && !i.isExotic).length);
  });

  it('gives every fixed talent its wording, in every slot', () => {
    for (const cache of ['Masks', 'Chest Pieces', 'Backpacks', 'Gloves', 'Holsters', 'Kneepads']) {
      for (const g of gearSlotDetail(data, cache)!.groups) {
        for (const { piece } of g.pieces) {
          if (piece.talent?.fixed) expect(piece.talent.description, piece.item.name).toBeTruthy();
        }
      }
    }
  });

  it('shows a named piece\'s core as its brand\'s default core', () => {
    const d = gearSlotDetail(data, 'Backpacks')!;
    const fm = d.groups.find((g) => g.tier === 'named')!.pieces.find((p) => p.piece.item.name === 'Force Multiplier')!;
    expect(fm.setName).toBe('Hana-U Corporation');
    expect(fm.piece.cores[0]).toMatchObject({ fixed: false, statId: 'skill-tier' });
  });
});
