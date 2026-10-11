/**
 * 每日戰利品頁用的資料 / The slice of the dataset the loot popups need.
 *
 * Imported by name rather than as one object. The planner imports the whole
 * file, so in practice both pages share one chunk — which also means the
 * browser cache serves it to whichever page comes second. The loot page loads
 * this lazily, on the first hover or click, so its first paint stays light.
 */
import { attributes, gear, gearTalents, sets, stats, weaponTalents, weapons } from './generated/game-data.json';
import type { SetData } from '../model/set-detail.ts';

export const lootData = { attributes, gear, gearTalents, sets, stats, weaponTalents, weapons } as unknown as SetData;
