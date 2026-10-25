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
