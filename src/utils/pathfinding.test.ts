import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { findPath } from './pathfinding';
import type { Cell } from './goldberg';

describe('findPath BFS', () => {
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
    const path = findPath(graph, 0, 1, 'BFS');
    expect(path).toEqual([0, 1]);
  });

  it('finds a multi-step path', () => {
    const path = findPath(graph, 0, 2, 'BFS');
    expect(path).toEqual([0, 1, 2]);
  });

  it('finds the shortest path when multiple exist', () => {
    const path = findPath(graph, 0, 4, 'BFS');
    expect(path.length).toBe(3);
    expect(path[0]).toBe(0);
    expect(path[2]).toBe(4);
  });

  it('returns a single element for same start and end', () => {
    const path = findPath(graph, 1, 1, 'BFS');
    expect(path).toEqual([1]);
  });

  it('returns empty array if no path exists', () => {
    const disconnectedGraph = new Map<number, number[]>([
      [0, [1]],
      [1, [0]],
      [2, []]
    ]);
    const path = findPath(disconnectedGraph, 0, 2, 'BFS');
    expect(path).toEqual([]);
  });
});

describe('findPath A*', () => {
  // Mock cells on a sphere
  // 0: (0,0,1) - Front
  // 1: (1,0,0) - Right
  // 2: (0,1,0) - Up
  // 3: (-1,0,0) - Left
  // 4: (0,-1,0) - Down
  const mockCells: Cell[] = [
    { id: 0, center: new THREE.Vector3(0, 0, 1), type: 'hexagon', neighbors: [1, 3], vertices: [], coordinates: { face: 0, u: 0, v: 0 }, isLand: false },
    { id: 1, center: new THREE.Vector3(1, 0, 0), type: 'hexagon', neighbors: [0, 2, 4], vertices: [], coordinates: { face: 0, u: 1, v: 0 }, isLand: false },
    { id: 2, center: new THREE.Vector3(0, 1, 0), type: 'hexagon', neighbors: [1], vertices: [], coordinates: { face: 0, u: 1, v: 1 }, isLand: false },
    { id: 3, center: new THREE.Vector3(-1, 0, 0), type: 'hexagon', neighbors: [0, 4], vertices: [], coordinates: { face: 0, u: -1, v: 0 }, isLand: false },
    { id: 4, center: new THREE.Vector3(0, -1, 0), type: 'hexagon', neighbors: [1, 3], vertices: [], coordinates: { face: 0, u: 0, v: -1 }, isLand: false },
  ];

  const graph = new Map<number, number[]>(mockCells.map(c => [c.id, c.neighbors]));

  it('finds a path using A*', () => {
    const path = findPath(graph, 0, 2, 'AStar', mockCells);
    expect(path).toEqual([0, 1, 2]);
  });

  it('A* finds the shortest path geometrically', () => {
    // 0 is at (0,0,1)
    // 1 is at (1,0,0)
    // 3 is at (-1,0,0)
    // 4 is at (0,-1,0)
    // Destination 1:
    const path = findPath(graph, 0, 1, 'AStar', mockCells);
    expect(path).toEqual([0, 1]);
  });
});
