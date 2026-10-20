/** 祭壇勾選 / One key per day; writing a day clears the others. */
import { describe, expect, it } from 'vitest';
import { setTicks, tickKey, ticksFor } from '../src/data/map/ticks.ts';

describe('altar ticks', () => {
  it('reads an absent day as nothing ticked', () => {
    expect(ticksFor({}, '2026-10-20')).toEqual([]);
  });

  it('writes a day sorted and unique, and drops earlier days only', () => {
    const c: Record<string, number[]> = { [tickKey('2026-10-19')]: [1, 2], 'broken-rain-beavers': [3] };
    setTicks(c, '2026-10-20', [5, 2, 5]);
    expect(c).toEqual({ [tickKey('2026-10-20')]: [2, 5], 'broken-rain-beavers': [3] });
  });
});
