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

  it('verifies neighbor reciprocity and cell types', () => {
    const board = generateGoldberg(2, 2); // Small board for speed
    
    board.cells.forEach(cell => {
      // Every cell must have 5 or 6 neighbors
      expect([5, 6]).toContain(cell.neighbors.length);
      
      // Type must match neighbor count
      if (cell.neighbors.length === 5) {
        expect(cell.type).toBe('pentagon');
      } else {
        expect(cell.type).toBe('hexagon');
      }

      // Reciprocity: if B is neighbor of A, then A must be neighbor of B
      cell.neighbors.forEach(neighborId => {
        const neighbor = board.cells[neighborId];
        expect(neighbor.neighbors).toContain(cell.id);
      });

      // Vertices count should match neighbor count
      expect(cell.vertices.length).toBe(cell.neighbors.length);
    });

    expect(board.pentagonCount).toBe(12);
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

  it('generates a valid GP(1,1) board (Truncated Icosahedron)', () => {
    const board = generateGoldberg(1, 1);
    // GP(1,1) has T=3. Faces = 10(2)+12 = 32.
    expect(board.cells.length).toBe(32);
    expect(board.pentagonCount).toBe(12);
    expect(board.hexagonCount).toBe(20);
  });
});
