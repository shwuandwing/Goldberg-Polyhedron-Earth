import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { generateGoldberg } from './goldberg';
import { createGlobeGeometry, updateColors } from './rendering';

describe('Goldberg Rendering Logic', () => {
  it('correctly maps every face to its cell ID in merged geometry', () => {
    const board = generateGoldberg(5, 5);
    const { geometry } = createGlobeGeometry(board);

    // Verify picking logic
    const cellIdAttr = geometry.getAttribute('aCellId');
    const positions = geometry.getAttribute('position');
    const totalFaces = positions.count / 3;
    
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
      const id = cellIdAttr.getX(faceIndex * 3);
      
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(board.cells.length);
      
      const vIdx = faceIndex * 3;
      const p1 = new THREE.Vector3().fromBufferAttribute(positions, vIdx);
      const cell = board.cells[id];
      const dist = p1.distanceTo(cell.center);
      
      // The vertices of a cell should be reasonably close to its center
      expect(dist).toBeLessThan(0.3);
    }
  });

  it('correctly updates colors based on state priority', () => {
    const board = generateGoldberg(5, 5);
    const { geometry, cellMap } = createGlobeGeometry(board);
    
    const startNode = 10;
    const endNode = 20;
    const pathSet = new Set([15]);
    const hoveredCellId = 20; // Hovering over end node

    updateColors({
      board,
      geometry,
      cellMap,
      startNode,
      endNode,
      pathSet,
      hoveredCellId
    });

    const colors = geometry.getAttribute('color');
    
    // Check start node color (Priority: Hover > End > Start > Path > Land/Ocean)
    // Actually in my code priority is: Path < Start < End < Hover
    
    // Start Node (10)
    const startMapping = cellMap.get(startNode)!;
    expect(colors.getX(startMapping.start)).toBeCloseTo(1.0); // R
    expect(colors.getY(startMapping.start)).toBeCloseTo(0.5); // G
    expect(colors.getZ(startMapping.start)).toBeCloseTo(0.0); // B

    // Path Node (15)
    const pathMapping = cellMap.get(15)!;
    expect(colors.getX(pathMapping.start)).toBeCloseTo(1.0); // R
    expect(colors.getY(pathMapping.start)).toBeCloseTo(0.8); // G
    expect(colors.getZ(pathMapping.start)).toBeCloseTo(0.0); // B

    // Hovered End Node (20) -> Should be White (Hover priority)
    const endMapping = cellMap.get(endNode)!;
    expect(colors.getX(endMapping.start)).toBe(1.0);
    expect(colors.getY(endMapping.start)).toBe(1.0);
    expect(colors.getZ(endMapping.start)).toBe(1.0);
  });
});