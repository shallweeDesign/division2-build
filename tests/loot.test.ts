/** 每日戰利品 / Parsing the Raigulus snapshot and naming what it lists. */
import { describe, expect, it } from 'vitest';
import { isStale, parseLoot, utcPhraseToLocal } from '../src/model/loot.ts';
import { cacheItemZh, cacheTypeZh, lootZh, missionZh } from '../src/i18n/loot.ts';
import { applyRows } from '../src/i18n/overrides.ts';

/** The file as served on 2026-10-09, trimmed of fields we do not read. */
const SAMPLE = {
  date: '2026-10-09',
  rotation: 'Weekly Escalation Rotation',
  missions: [
    { mission: 'Pathway Park', loot: 'Walker, Harris & Co' },
    { mission: 'Camp White Oak', loot: 'Hana-U Corporation' },
    { mission: 'Grand Washington Hotel', loot: 'Grupo Sombra S.A.' },
    { mission: 'Jefferson Trade Center', loot: 'Petrov Defense Group' },
    { mission: 'Federal Emergency Bunker', loot: 'Heartbreaker' },
  ],
  vendor_caches: [
    { type: 'Weapons', item: 'MMRs' },
    { type: 'Gear', item: 'Chest Pieces' },
  ],
  last_updated: '2026-10-09 10:01',
  last_checked: '2026-10-09 10:05 UTC',
  status: 'ok',
  next_expected_update: 'Around 07:00 UTC',
  snapshot_note: 'Current dated loot snapshot is available.',
};

describe('parseLoot', () => {
  it('reads the live shape', () => {
    const snap = parseLoot(SAMPLE)!;
    expect(snap.date).toBe('2026-10-09');
    expect(snap.missions).toHaveLength(5);
    expect(snap.vendorCaches).toEqual([
      { type: 'Weapons', item: 'MMRs' },
      { type: 'Gear', item: 'Chest Pieces' },
    ]);
    expect(snap.lastChecked).toBe('2026-10-09 10:05 UTC');
  });

  it('rejects a file whose core is missing', () => {
    expect(parseLoot(null)).toBeNull();
    expect(parseLoot({ ...SAMPLE, date: 'today' })).toBeNull();
    expect(parseLoot({ ...SAMPLE, missions: 'none' })).toBeNull();
    expect(parseLoot({ ...SAMPLE, missions: [{ mission: '', loot: '' }] })).toBeNull();
  });

  it('drops malformed rows and tolerates missing extras', () => {
    const snap = parseLoot({
      date: '2026-10-09',
      missions: [{ mission: 'A', loot: 'B' }, { mission: 'C' }, null],
    })!;
    expect(snap.missions).toEqual([{ mission: 'A', loot: 'B' }]);
    expect(snap.vendorCaches).toEqual([]);
    expect(snap.lastChecked).toBe('');
  });

  it('falls back to last_updated when last_checked is absent', () => {
    const { last_checked: _, ...rest } = SAMPLE;
    expect(parseLoot(rest)!.lastChecked).toBe('2026-10-09 10:01');
  });
});

describe('dates and times', () => {
  it('flags a snapshot from another UTC day', () => {
    const snap = parseLoot(SAMPLE)!;
    expect(isStale(snap, new Date('2026-10-09T23:59:00Z'))).toBe(false);
    expect(isStale(snap, new Date('2026-10-10T03:00:00Z'))).toBe(true);
  });

  it('converts the UTC time in a phrase to local time', () => {
    const now = new Date('2026-10-09T12:00:00Z');
    const expected = new Date(Date.UTC(2026, 9, 9, 7, 0));
    const hh = String(expected.getHours()).padStart(2, '0');
    const mm = String(expected.getMinutes()).padStart(2, '0');
    expect(utcPhraseToLocal('Around 07:00 UTC', now)).toBe(`${hh}:${mm}`);
    expect(utcPhraseToLocal('soon', now)).toBeNull();
  });
});

describe('loot names', () => {
  it('finds every target in today\'s sample, despite the missing trailing dot', () => {
    for (const { loot } of SAMPLE.missions) expect(lootZh(loot), loot).toBeTruthy();
    expect(lootZh('Walker, Harris & Co')).toBe(lootZh('Walker, Harris & Co.'));
  });

  it('names the vendor caches', () => {
    for (const { type, item } of SAMPLE.vendor_caches) {
      expect(cacheTypeZh(type)).toBeTruthy();
      expect(cacheItemZh(item)).toBeTruthy();
    }
  });

  it('leaves missions in English until the sheet names them', () => {
    expect(missionZh('Camp White Oak')).toBeUndefined();
    applyRows([['kind', 'key', 'zh-tw'], ['mission', 'Camp White Oak', '測試譯名']]);
    expect(missionZh('Camp White Oak')).toBe('測試譯名');
  });
});
