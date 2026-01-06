
export function findPath(graph: Map<number, number[]>, startId: number, endId: number): number[] {
  if (startId === endId) return [startId];
  
  const queue: number[] = [startId];
  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) {
      // Reconstruct path
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
  
  return []; // No path found
}
