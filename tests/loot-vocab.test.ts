/** 戰利品詞彙 / How loot words resolve, and how new wordings are absorbed. */
import { describe, expect, it } from 'vitest';
import { LOOT_ALIAS, resolveLoot } from '../src/model/loot-vocab.ts';
import { applyRows } from '../src/i18n/overrides.ts';

describe('resolveLoot', () => {
  it('reads the same slot from the cache and the target wording', () => {
    expect(resolveLoot('Chest Pieces')).toEqual({ kind: 'slot', slot: 'chest' });
    expect(resolveLoot('Body Armor')).toEqual({ kind: 'slot', slot: 'chest' });
    expect(resolveLoot('Knee Pads')).toEqual({ kind: 'slot', slot: 'knees' });
  });

  it('ignores case, punctuation, spacing and a plural s', () => {
    for (const w of ['SMG', 'SMGs', 'smg', 'S.M.G.']) expect(resolveLoot(w), w).toEqual({ kind: 'weapon', weaponType: 'SMG' });
    expect(resolveLoot('MMRs')).toEqual({ kind: 'weapon', weaponType: 'Marksman Rifle' });
    expect(resolveLoot('Rifles')).toEqual({ kind: 'weapon', weaponType: 'Rifle' });
    expect(resolveLoot('Assault Rifles')).toEqual({ kind: 'weapon', weaponType: 'Assault Rifle' });
  });

  it('finds brands and sets by the dataset name, whatever the punctuation', () => {
    expect(resolveLoot('Walker, Harris & Co')).toEqual({ kind: 'set', name: 'Walker, Harris & Co.' });
    expect(resolveLoot('Legatus S.p.A.')).toMatchObject({ kind: 'set' });
    expect(resolveLoot('ortiz reficere')).toMatchObject({ kind: 'set' });
    expect(resolveLoot('Ember Engine')).toEqual({ kind: 'set', name: 'Ember Engine' });
  });

  it('calls a word it does not know unknown, never a guess', () => {
    expect(resolveLoot('Mystery Crate')).toEqual({ kind: 'unknown' });
    expect(resolveLoot('')).toEqual({ kind: 'unknown' });
  });

  it('learns a new wording from a sheet alias row, no deploy needed', () => {
    expect(resolveLoot('Torso Gear')).toEqual({ kind: 'unknown' });
    applyRows([['kind', 'key', 'zh-tw'], ['alias', 'Torso Gear', 'Chest Pieces']]);
    expect(resolveLoot('Torso Gear')).toEqual({ kind: 'slot', slot: 'chest' });
    // An alias pointing at nothing known changes nothing.
    applyRows([['kind', 'key', 'zh-tw'], ['alias', 'Odd Thing', 'Not A Thing']]);
    expect(resolveLoot('Odd Thing')).toEqual({ kind: 'unknown' });
    for (const k of Object.keys(LOOT_ALIAS)) delete LOOT_ALIAS[k];
  });
});
