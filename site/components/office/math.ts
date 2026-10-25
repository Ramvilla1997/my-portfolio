import type { Point } from '../../agents/roster';

/* The floor is a square of this many world units across. Plan percentages map onto it. */
export const PLAN_SIZE = 14;

export interface Timed {
  readonly path: readonly Point[];
  readonly times: readonly number[];
  readonly seconds: number;
}

export function planToWorld(point: Point): { x: number; z: number } {
  return {
    x: ((point.x - 50) / 100) * PLAN_SIZE,
    z: ((point.y - 50) / 100) * PLAN_SIZE,
  };
}

/* Where an agent is on its walk after a number of seconds. Clamps at both ends. */
export function positionAt(walk: Timed, elapsedSeconds: number): Point {
  const last = walk.path[walk.path.length - 1] ?? { x: 50, y: 50 };
  if (walk.seconds <= 0 || walk.path.length < 2) {
    return last;
  }
  const progress = Math.min(1, Math.max(0, elapsedSeconds / walk.seconds));
  for (let index = 1; index < walk.path.length; index += 1) {
    const start = walk.times[index - 1] ?? 0;
    const end = walk.times[index] ?? 1;
    if (progress <= end) {
      const span = end - start || 1;
      const amount = (progress - start) / span;
      const from = walk.path[index - 1];
      const to = walk.path[index];
      return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount };
    }
  }
  return last;
}
