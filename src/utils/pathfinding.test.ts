import { describe, it, expect } from 'vitest';
import { findPath } from './pathfinding';

describe('findPath', () => {
  // Mock graph:
  // 0 - 1 - 2
  // |   |
  // 3 - 4
  const graph = new Map<number, number[]>([
    [0, [1, 3]],
    [1, [0, 2, 4]],
    [2, [1]],
    [3, [0, 4]],
    [4, [1, 3]]
  ]);

  it('finds a direct neighbor path', () => {
    const path = findPath(graph, 0, 1);
    expect(path).toEqual([0, 1]);
  });

  it('finds a multi-step path', () => {
    const path = findPath(graph, 0, 2);
    expect(path).toEqual([0, 1, 2]);
  });

  it('finds the shortest path when multiple exist', () => {
    // 0 -> 1 -> 4 is length 2
    // 0 -> 3 -> 4 is length 2
    const path = findPath(graph, 0, 4);
    expect(path.length).toBe(3); // [0, 1, 4] or [0, 3, 4]
    expect(path[0]).toBe(0);
    expect(path[2]).toBe(4);
  });

  it('returns a single element for same start and end', () => {
    const path = findPath(graph, 1, 1);
    expect(path).toEqual([1]);
  });

  it('returns empty array if no path exists', () => {
    const disconnectedGraph = new Map<number, number[]>([
      [0, [1]],
      [1, [0]],
      [2, []]
    ]);
    const path = findPath(disconnectedGraph, 0, 2);
    expect(path).toEqual([]);
  });

  it('handles empty graphs', () => {
    const emptyGraph = new Map<number, number[]>();
    const path = findPath(emptyGraph, 0, 1);
    expect(path).toEqual([]);
  });
});
