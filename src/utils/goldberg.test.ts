import { describe, it, expect } from 'vitest';
import { generateGoldberg } from './goldberg';
import { findPath } from './pathfinding';

describe('Goldberg Board Integration', () => {
  it('generates a valid GP(3,3) board with correct counts', () => {
    const board = generateGoldberg(3, 3);
    // GP(3,3) has T=27. Faces = 10(27-1)+12 = 272.
    expect(board.cells.length).toBe(272);
    expect(board.pentagonCount).toBe(12);
    expect(board.hexagonCount).toBe(260);
  });

  it('can find a path across the GP(3,3) board', () => {
    const board = generateGoldberg(3, 3);
    const startId = 0;
    const endId = board.cells.length - 1;
    
    const path = findPath(board.graph, startId, endId);
    
    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toBe(startId);
    expect(path[path.length - 1]).toBe(endId);
    
    // Verify all steps are actual neighbors
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i+1];
      const neighbors = board.graph.get(current);
      expect(neighbors).toContain(next);
    }
  });

  it('generates a valid GP(5,5) board with correct counts', () => {
    const board = generateGoldberg(5, 5);
    // GP(5,5) has T=75. Faces = 10(74)+12 = 752.
    expect(board.cells.length).toBe(752);
    expect(board.pentagonCount).toBe(12);
    expect(board.hexagonCount).toBe(740);
  });
});
