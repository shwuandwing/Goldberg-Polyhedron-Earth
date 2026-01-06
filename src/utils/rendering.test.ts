import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { generateGoldberg } from './goldberg';

describe('Goldberg Rendering Logic', () => {
  it('correctly maps every face to its cell ID in merged geometry', () => {
    const board = generateGoldberg(5, 5); // Use GP(5,5) for speed
    
    // Simulate geometry construction from GoldbergGlobe
    const positions: number[] = [];
    const cellIds: number[] = [];
    
    board.cells.forEach(cell => {
      const center = cell.center;
      const verts = cell.vertices;
      
      for (let i = 0; i < verts.length; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % verts.length];
        
        positions.push(center.x, center.y, center.z);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
        
        for(let k=0; k<3; k++) {
          cellIds.push(cell.id);
        }
      }
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aCellId', new THREE.Int32BufferAttribute(cellIds, 1));

    // Verify picking logic
    const cellIdAttr = geometry.getAttribute('aCellId');
    const totalFaces = positions.length / 9;
    
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
      const id = cellIdAttr.getX(faceIndex * 3);
      
      // Check if ID is valid
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(board.cells.length);
      
      // Verify triangle vertices are within the expected cell boundaries (approximate)
      const vIdx = faceIndex * 3;
      const p1 = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), vIdx);
      const p2 = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), vIdx + 1);
      const p3 = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), vIdx + 2);
      
      const cell = board.cells[id];
      const dist1 = p1.distanceTo(cell.center);
      const dist2 = p2.distanceTo(cell.center);
      const dist3 = p3.distanceTo(cell.center);
      
      // The vertices of a cell should be reasonably close to its center
      // (relative to the grid size)
      expect(dist1).toBeLessThan(0.3);
      expect(dist2).toBeLessThan(0.3);
      expect(dist3).toBeLessThan(0.3);
    }
  });
});
