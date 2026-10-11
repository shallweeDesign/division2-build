/**
 * 每日戰利品頁用的資料 / The slice of the dataset the loot popup needs.
 *
 * Imported by name, not as the whole object, so the bundler can drop the
 * weapons, mods and specializations the loot page never shows. The loot page
 * loads this lazily, on the first click, so its first paint stays light.
 */
import { attributes, gear, gearTalents, sets, stats } from './generated/game-data.json';
import type { SetData } from '../model/set-detail.ts';

export const lootData = { attributes, gear, gearTalents, sets, stats } as unknown as SetData;
