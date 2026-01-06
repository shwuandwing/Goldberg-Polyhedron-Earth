import * as THREE from 'three';
import type { GoldbergBoard } from './goldberg';

export interface RenderingData {
  geometry: THREE.BufferGeometry;
  cellMap: Map<number, { start: number; count: number }>;
}

/**
 * Creates a merged BufferGeometry for the entire Goldberg board.
 * Each cell is represented by a set of triangles sharing a common center point.
 * Includes 'aCellId' attribute for efficient picking.
 */
export function createGlobeGeometry(board: GoldbergBoard): RenderingData {
  const positions: number[] = [];
  const colors: number[] = [];
  const cellIds: number[] = [];
  const map = new Map<number, { start: number; count: number }>();
  
  let currentVertex = 0;
  board.cells.forEach(cell => {
    const start = currentVertex;
    const center = cell.center;
    const verts = cell.vertices;
    
    // Build triangles for the cell (fan-like structure from center)
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];
      
      positions.push(center.x, center.y, center.z);
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);
      
      for(let k = 0; k < 3; k++) {
        colors.push(1, 1, 1);
        cellIds.push(cell.id);
      }
      currentVertex += 3;
    }
    map.set(cell.id, { start, count: currentVertex - start });
  });
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('aCellId', new THREE.Int32BufferAttribute(cellIds, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  return { geometry: geo, cellMap: map };
}

export interface ColorUpdateParams {
  board: GoldbergBoard;
  geometry: THREE.BufferGeometry;
  cellMap: Map<number, { start: number; count: number }>;
  startNode: number | null;
  endNode: number | null;
  pathSet: Set<number>;
  hoveredCellId: number | null;
}

/**
 * Updates the vertex colors of the merged geometry based on current state.
 */
export function updateColors({
  board,
  geometry,
  cellMap,
  startNode,
  endNode,
  pathSet,
  hoveredCellId
}: ColorUpdateParams) {
  const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
  const colors = colorAttr.array as Float32Array;

  board.cells.forEach(cell => {
    const mapping = cellMap.get(cell.id);
    if (!mapping) return;

    const { start, count } = mapping;
    
    // Default colors
    let r = 0.1, g = 0.35, b = 0.6; // Deep ocean
    if (cell.isLand) { r = 0.1, g = 0.45, b = 0.2; } // Lush land
    
    // State-based overrides (in priority order)
    if (pathSet.has(cell.id)) { r = 1.0, g = 0.8, b = 0.0; } // Gold path
    if (cell.id === startNode) { r = 1.0, g = 0.5, b = 0.0; } // Start
    if (cell.id === endNode) { r = 1.0, g = 0.2, b = 0.2; } // End
    if (cell.id === hoveredCellId) { r = 1.0, g = 1.0, b = 1.0; } // Hover (Highest priority)

    for (let i = 0; i < count; i++) {
      const idx = (start + i) * 3;
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
  });

  colorAttr.needsUpdate = true;
}
