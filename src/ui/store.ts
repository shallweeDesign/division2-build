/**
 * 狀態容器 / Central build state with change notification.
 *
 * Two signals rather than one: swapping an item changes the shape of a slot's
 * controls and needs the gear column rebuilt, while nudging a rolled value only
 * needs the summary recomputed. Keeping them apart stops a re-render from
 * stealing focus out of the input the player is typing in.
 */
import type { BuildState } from '../model/build.ts';
import { emptyBuild } from '../model/build.ts';

export type Scope = 'gear' | 'summary';
type Listener = (scope: Scope) => void;

const listeners: Listener[] = [];
let state: BuildState = emptyBuild();

export const build = () => state;

export function subscribe(fn: Listener) {
  listeners.push(fn);
}

/** Apply a mutation, then notify at the given scope. */
export function update(scope: Scope, fn: (b: BuildState) => void) {
  fn(state);
  for (const l of listeners) l(scope);
}

export function reset() {
  state = emptyBuild();
  for (const l of listeners) l('gear');
}
