import type { Cell } from './goldberg';

export type PathfindingAlgorithm = 'BFS' | 'AStar';

export function findPath(
  graph: Map<number, number[]>, 
  startId: number, 
  endId: number, 
  algorithm: PathfindingAlgorithm = 'BFS',
  cells?: Cell[],
  m?: number
): number[] {
  if (algorithm === 'AStar' && cells) {
    return findPathAStar(graph, startId, endId, cells, m);
  }
  return findPathBFS(graph, startId, endId);
}

function findPathBFS(graph: Map<number, number[]>, startId: number, endId: number): number[] {
  if (startId === endId) return [startId];
  
  const queue: number[] = [startId];
  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) {
      const path: number[] = [endId];
      let curr = endId;
      while (curr !== startId) {
        curr = parent.get(curr)!;
        path.unshift(curr);
      }
      return path;
    }
    
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  
  return [];
}

function findPathAStar(
  graph: Map<number, number[]>, 
  startId: number, 
  endId: number, 
  cells: Cell[],
  m: number = 43
): number[] {
  if (startId === endId) return [startId];

  const targetCenter = cells[endId].center;
  const openSet: [number, number][] = [[startId, 0]];
  const cameFrom = new Map<number, number>();
  
  const gScore = new Map<number, number>();
  gScore.set(startId, 0);

  // Scale factor: roughly how many hops per unit of 3D distance.
  // Circumference is 2*PI. Total hops around equator is ~4*m.
  const scaleFactor = (4 * m) / (2 * Math.PI);

  const fScore = new Map<number, number>();
  fScore.set(startId, cells[startId].center.distanceTo(targetCenter) * scaleFactor);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a[1] - b[1]);
    const [current] = openSet.shift()!;

    if (current === endId) {
      const path: number[] = [endId];
      let curr = endId;
      while (curr !== startId) {
        curr = cameFrom.get(curr)!;
        path.unshift(curr);
      }
      return path;
    }

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const tentativeGScore = (gScore.get(current) ?? Infinity) + 1;

      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        
        // Use the dynamic scale factor to keep h comparable to g
        const h = cells[neighbor].center.distanceTo(targetCenter) * scaleFactor;
        const f = tentativeGScore + h;
        fScore.set(neighbor, f);

        if (!openSet.find(item => item[0] === neighbor)) {
          openSet.push([neighbor, f]);
        }
      }
    }
  }

  return [];
}