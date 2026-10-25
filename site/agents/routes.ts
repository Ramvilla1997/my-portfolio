import { roster, type AgentRole, type Point, type SectionId } from './roster';

export interface Walk {
  readonly path: Point[];
  readonly times: number[];
  readonly seconds: number;
}

const SPEED_PER_SECOND = 40;
const MIN_SECONDS = 0.6;
const MAX_SECONDS = 3.5;

/* Each room has a door on the hallway that runs between the rows and columns of rooms. */
export const DOORS: Readonly<Record<SectionId, Point>> = {
  about: { x: 24, y: 49 },
  experience: { x: 76, y: 49 },
  projects: { x: 24, y: 51 },
  resume: { x: 76, y: 51 },
};

export function workPointFor(section: SectionId): Point {
  const owner = roster.find((agent) => agent.section === section);
  if (!owner) {
    throw new Error(`No agent works in ${section}`);
  }
  return owner.work;
}

/* Desk to a work point. Outside its own room, an agent leaves through its door and walks the hallway. */
export function routeFromDesk(role: AgentRole, target: SectionId): Point[] {
  if (target === role.section) {
    return [role.desk, { x: role.work.x, y: role.desk.y }, role.work];
  }
  const work = workPointFor(target);
  const from = DOORS[role.section];
  const to = DOORS[target];
  return [role.desk, { x: from.x, y: role.desk.y }, from, { x: to.x, y: from.y }, to, { x: to.x, y: work.y }, work];
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/* Turns a list of points into keyframes whose timing follows the distance walked. */
export function walkOf(points: readonly Point[]): Walk {
  const first = points[0];
  if (!first) {
    throw new Error('A walk needs at least one point');
  }
  const path = points.length === 1 ? [first, first] : [...points];
  const cumulative: number[] = [0];
  for (let index = 1; index < path.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distance(path[index - 1], path[index]));
  }
  const total = cumulative[cumulative.length - 1];
  const times =
    total === 0 ? path.map((_, index) => index / (path.length - 1)) : cumulative.map((value) => value / total);
  const seconds = total === 0 ? MIN_SECONDS : Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, total / SPEED_PER_SECOND));
  return { path, times, seconds };
}

export function reversed(points: readonly Point[]): Point[] {
  return [...points].reverse();
}
