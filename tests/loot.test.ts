/** 每日戰利品 / Parsing the Raigulus snapshot and naming what it lists. */
import { describe, expect, it } from 'vitest';
import { isStale, localClock, nextReset, parseLoot, rotationDate } from '../src/model/loot.ts';
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
  // The rotation turns over at 08:00 UTC, not at UTC midnight and not at the
  // 07:00 the source's own text claims; see DAILY_RESET_UTC_HOUR.
  it('names the rotation by the 08:00 UTC reset it began at', () => {
    expect(rotationDate(new Date('2026-10-10T07:59:00Z'))).toBe('2026-10-09');
    expect(rotationDate(new Date('2026-10-10T08:00:00Z'))).toBe('2026-10-10');
  });

  it('does not flag the current rotation as stale between UTC midnight and the reset', () => {
    const snap = parseLoot(SAMPLE)!;                          // date 2026-10-09
    expect(isStale(snap, new Date('2026-10-10T03:00:00Z'))).toBe(false);
    expect(isStale(snap, new Date('2026-10-10T07:59:00Z'))).toBe(false);
    expect(isStale(snap, new Date('2026-10-10T08:03:00Z'))).toBe(true);
  });

  it('finds the next reset, rolling to tomorrow once today\'s has passed', () => {
    expect(nextReset(new Date('2026-10-11T07:00:00Z')).toISOString()).toBe('2026-10-11T08:00:00.000Z');
    expect(nextReset(new Date('2026-10-11T08:00:00Z')).toISOString()).toBe('2026-10-12T08:00:00.000Z');
    expect(nextReset(new Date('2026-10-11T23:30:00Z')).toISOString()).toBe('2026-10-12T08:00:00.000Z');
  });

  it('shows 08:00 UTC as 16:00 in Taipei', () => {
    const at = new Date('2026-10-11T08:00:00Z');
    const offsetMin = -at.getTimezoneOffset();
    const local = new Date(Date.UTC(2026, 9, 11, 8, 0) + offsetMin * 60000);
    const hhmm = `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
    expect(localClock(at)).toBe(hhmm);
    if (offsetMin === 480) expect(localClock(at)).toBe('16:00');
  });
});

describe('loot names', () => {
  it('finds every target in today\'s sample, despite the missing trailing dot', () => {
    for (const { loot } of SAMPLE.missions) expect(lootZh(loot), loot).toBeTruthy();
    expect(lootZh('Walker, Harris & Co')).toBe(lootZh('Walker, Harris & Co.'));
  });

  // Every value the source published between 2026-09 and 2026-10-11 (its
  // last 100 commits): brands, gear sets, and the odd weapon class.
  it('names every target and cache the source has published so far', () => {
    const targets = ['Airaldi Holdings', 'China Light Industries', 'Concentrated Company', 'Edelweiss GPz',
      'Electrique', 'Foundry Bulwark', 'Grupo Sombra S.A.', 'Hana-U Corporation', 'Hard Wired', 'Heartbreaker',
      'Legatus S.p.A.', 'Ongoing Directive', 'Ortiz: Reficere', 'Overlord Armaments', 'Petrov Defense Group',
      'Pistol', 'Providence Defense', 'Refactor', 'SMG', 'Tip of the Spear', 'Tipping Scales', 'True Patriot',
      'Walker, Harris & Co'];
    for (const n of targets) expect(lootZh(n), n).toBeTruthy();
    const caches = ['Backpacks', 'Chest Pieces', 'Gloves', 'Holsters', 'Assault Rifles', 'MMRs', 'Rifles', 'Shotguns'];
    for (const n of caches) expect(cacheItemZh(n), n).toBeTruthy();
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
