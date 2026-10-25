import { describe, expect, it } from 'vitest';
import { roster, rooms } from '../agents/roster';
import { routeFromDesk, walkOf } from '../agents/routes';

describe('walking routes', () => {
  it('keeps every route inside the floor and on straight hallway and room lines', () => {
    for (const role of roster) {
      for (const room of rooms) {
        const route = routeFromDesk(role, room.id);
        for (const point of route) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(100);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(100);
        }
        for (let index = 1; index < route.length; index += 1) {
          const previous = route[index - 1];
          const current = route[index];
          expect(previous.x === current.x || previous.y === current.y).toBe(true);
        }
      }
    }
  });

  it('times a walk by its length and keeps it within readable bounds', () => {
    const walk = walkOf([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(walk.seconds).toBeGreaterThanOrEqual(0.6);
    expect(walk.seconds).toBeLessThanOrEqual(3.5);
    expect(walk.times[0]).toBe(0);
    expect(walk.times[walk.times.length - 1]).toBe(1);
  });

  it('gives a single point a short two-point walk so animation still works', () => {
    const walk = walkOf([{ x: 10, y: 10 }]);
    expect(walk.path.length).toBe(2);
    expect(walk.times).toEqual([0, 1]);
  });
});
