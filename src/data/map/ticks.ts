/**
 * 祭壇勾選 / Which Red Moon altars were shot today, kept in the player's data
 * (`cloud/user-data.ts`) so they follow a signed-in player between browsers.
 *
 * Stored under the collectibles map as `red-moon-altars:<day>`, the day being
 * the 08:00 UTC rotation date: a new day is simply a new, empty key. Writing
 * a day drops every other day's key, so the document never piles them up.
 */
export const TICK_PREFIX = 'red-moon-altars:';
export const tickKey = (day: string) => `${TICK_PREFIX}${day}`;

export function ticksFor(collectibles: Record<string, number[]>, day: string): number[] {
  return collectibles[tickKey(day)] ?? [];
}

/** Set one day's ticks in place, removing other days' keys. */
export function setTicks(collectibles: Record<string, number[]>, day: string, ticks: number[]) {
  for (const k of Object.keys(collectibles)) if (k.startsWith(TICK_PREFIX) && k !== tickKey(day)) delete collectibles[k];
  collectibles[tickKey(day)] = [...new Set(ticks)].sort((a, b) => a - b);
}
