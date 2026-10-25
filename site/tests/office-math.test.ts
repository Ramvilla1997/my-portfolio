import { describe, expect, it } from 'vitest';
import { planToWorld, positionAt, PLAN_SIZE } from '../components/office/math';

describe('office coordinates', () => {
  it('puts the centre of the plan at the centre of the floor', () => {
    expect(planToWorld({ x: 50, y: 50 })).toEqual({ x: 0, z: 0 });
  });

  it('spans the whole floor from edge to edge', () => {
    expect(planToWorld({ x: 0, y: 0 })).toEqual({ x: -PLAN_SIZE / 2, z: -PLAN_SIZE / 2 });
    expect(planToWorld({ x: 100, y: 100 })).toEqual({ x: PLAN_SIZE / 2, z: PLAN_SIZE / 2 });
  });

  it('moves an agent along its walk over time and holds it at the end', () => {
    const walk = {
      path: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      times: [0, 1],
      seconds: 2,
    };
    expect(positionAt(walk, 0)).toEqual({ x: 0, y: 0 });
    expect(positionAt(walk, 1)).toEqual({ x: 50, y: 0 });
    expect(positionAt(walk, 5)).toEqual({ x: 100, y: 0 });
  });

  it('follows each leg of a bent path with its own timing', () => {
    const walk = {
      path: [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
      ],
      times: [0, 0.5, 1],
      seconds: 4,
    };
    expect(positionAt(walk, 2)).toEqual({ x: 0, y: 100 });
    expect(positionAt(walk, 3)).toEqual({ x: 50, y: 100 });
  });
});
