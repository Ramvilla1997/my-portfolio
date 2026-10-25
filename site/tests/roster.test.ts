import { describe, expect, it } from 'vitest';
import { roster } from '../agents/roster';

describe('agent roster', () => {
  it('gives every agent at least two small idle tasks to rotate through', () => {
    for (const agent of roster) {
      expect(agent.idleTasks.length).toBeGreaterThanOrEqual(2);
      for (const task of agent.idleTasks) {
        expect(task.trim().length).toBeGreaterThan(10);
      }
    }
  });
});

describe('agent placement', () => {
  it('gives every agent its own desk and work spot, inside the floor', () => {
    const spots = roster.flatMap((agent) => [agent.desk, agent.work]);
    for (const spot of spots) {
      expect(spot.x).toBeGreaterThan(0);
      expect(spot.x).toBeLessThan(100);
      expect(spot.y).toBeGreaterThan(0);
      expect(spot.y).toBeLessThan(100);
    }
    const desks = new Set(roster.map((agent) => `${agent.desk.x},${agent.desk.y}`));
    expect(desks.size).toBe(roster.length);
  });
});
