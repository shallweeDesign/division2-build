/**
 * 收集品清單 / Every collection on the collectibles page, in tab order.
 * A new collection is a data file plus one entry here.
 */
import { BEAVERS } from './broken-rain-beavers.ts';
import { DARK_HOURS } from './raid-dark-hours.ts';
import { IRON_HORSE } from './raid-iron-horse.ts';
import type { Collection } from './types.ts';

export const COLLECTIONS: Collection[] = [BEAVERS, DARK_HOURS, IRON_HORSE];
