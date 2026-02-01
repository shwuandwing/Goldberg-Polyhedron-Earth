import { describe, it, expect } from 'vitest';
import { findPath } from './pathfinding';
import { generateGoldberg } from './goldberg';

describe('Pathfinding Logic', () => {
  const board = generateGoldberg(5, 5);

  it('finds a path using BFS between distant nodes', () => {
    const start = 0;
    const end = 100;
    const path = findPath(board.graph, start, end, 'BFS');
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toBe(start);
    expect(path[path.length - 1]).toBe(end);
  });

  it('finds a path using A* between distant nodes', () => {
    const start = 0;
    const end = 100;
    const path = findPath(board.graph, start, end, 'AStar', board.cells);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toBe(start);
    expect(path[path.length - 1]).toBe(end);
  });

  it('A* path length should be equal to or close to BFS path length on a grid', () => {
    const start = 10;
    const end = 250;
    const pathBFS = findPath(board.graph, start, end, 'BFS');
    const pathAStar = findPath(board.graph, start, end, 'AStar', board.cells);
    // On a Goldberg grid, both should find the shortest path (minimum hops)
    expect(pathAStar.length).toBe(pathBFS.length);
  });

  it('returns an empty path if no path exists', () => {
    const disconnectedGraph = new Map<number, number[]>();
    disconnectedGraph.set(0, [1]);
    disconnectedGraph.set(1, [0]);
    disconnectedGraph.set(2, [3]);
    disconnectedGraph.set(3, [2]);

    const path = findPath(disconnectedGraph, 0, 2, 'BFS');
    expect(path).toEqual([]);
    
    const pathAStar = findPath(disconnectedGraph, 0, 2, 'AStar', board.cells);
    expect(pathAStar).toEqual([]);
  });

  it('returns a single node path if start and end are the same', () => {
    const path = findPath(board.graph, 5, 5, 'BFS');
    expect(path).toEqual([5]);
  });

  describe('Dynamic Scaling Parity', () => {
    [2, 5, 10].forEach(m => {
      it(`finds shortest path parity at resolution m=${m}`, () => {
        const b = generateGoldberg(m, 0);
        const start = 0;
        const end = b.cells.length - 1;
        
        const pathBFS = findPath(b.graph, start, end, 'BFS');
        const pathAStar = findPath(b.graph, start, end, 'AStar', b.cells, m);
        
        // A* should find a path with the same number of hops as BFS
        expect(pathAStar.length).toBe(pathBFS.length);
      });
    });
  });
});