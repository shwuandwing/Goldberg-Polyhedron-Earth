import { describe, it, expect } from 'vitest';
import { generateGoldberg, isPointInLand } from './goldberg';
import * as THREE from 'three';

describe('Goldberg Geometry', () => {
  it('generates an icosahedron for GP(1,0)', () => {
    const board = generateGoldberg(1, 0);
    // GP(1,0) should have exactly 12 vertices (cells in our dual representation)
    expect(board.cells.length).toBe(12);
    expect(board.pentagonCount).toBe(12);
    expect(board.hexagonCount).toBe(0);
    
    // Every cell should have 5 neighbors in an icosahedron
    board.cells.forEach(cell => {
      expect(cell.neighbors.length).toBe(5);
      expect(cell.type).toBe('pentagon');
    });
  });

  it('always has exactly 12 pentagons for any GP(m,n)', () => {
    const board = generateGoldberg(3, 2);
    expect(board.pentagonCount).toBe(12);
    // Euler's formula implication for Goldberg polyhedra
    expect(board.cells.length).toBe(10 * (3*3 + 3*2 + 2*2) + 2);
  });

  it('correctly identifies land vs ocean (sanity check)', () => {
    // [0, 0, 1] is Equator/Prime Meridian (Gulf of Guinea - Ocean)
    const oceanPoint = new THREE.Vector3(0, 0, 1);
    expect(isPointInLand(oceanPoint)).toBe(false);

    // North Pole is Ocean
    const northPole = new THREE.Vector3(0, 1, 0);
    expect(isPointInLand(northPole)).toBe(false);

    // South Pole (Antarctica) is Land
    const southPole = new THREE.Vector3(0, -1, 0);
    expect(isPointInLand(southPole)).toBe(true);
  });

  it('can generate a GP(43,0) board without neighbor errors', () => {
    // This is the resolution used in the app (Class 1).
    // We want to ensure it doesn't throw the "Spatial search failed" error.
    const board = generateGoldberg(43, 0);
    expect(board.cells.length).toBe(18492);
    expect(board.pentagonCount).toBe(12);
  }, 20000);
    
      it('verifies that all cells have valid neighbor counts and IDs', () => {
        const board = generateGoldberg(10, 10);
        const cellIds = new Set(board.cells.map(c => c.id));
        
        board.cells.forEach(cell => {
          // Every cell in a Goldberg polyhedron must have 5 (pentagon) or 6 (hexagon) neighbors
          expect([5, 6]).toContain(cell.neighbors.length);
          
          cell.neighbors.forEach(neighborId => {
            // Neighbor must exist
            expect(cellIds.has(neighborId)).toBe(true);
            // Reciprocity: neighbor should also have this cell as a neighbor
            const neighbor = board.cells[neighborId];
            expect(neighbor.neighbors).toContain(cell.id);
          });
        });
      });

  it('verifies polar alignment: pentagons are at the poles', () => {
    const board = generateGoldberg(10, 0);
    
    // Find cells closest to North and South poles
    let northPoleCell = board.cells[0];
    let southPoleCell = board.cells[0];
    let minNorthDist = Infinity;
    let minSouthDist = Infinity;
    
    const northTarget = new THREE.Vector3(0, 1, 0);
    const southTarget = new THREE.Vector3(0, -1, 0);
    
    board.cells.forEach(cell => {
      const dN = cell.center.distanceTo(northTarget);
      const dS = cell.center.distanceTo(southTarget);
      
      if (dN < minNorthDist) {
        minNorthDist = dN;
        northPoleCell = cell;
      }
      if (dS < minSouthDist) {
        minSouthDist = dS;
        southPoleCell = cell;
      }
    });
    
    // The closest cells to the poles must be pentagons
    expect(northPoleCell.type).toBe('pentagon');
    expect(southPoleCell.type).toBe('pentagon');
    
    // They should be very close to the actual pole coordinates
    expect(minNorthDist).toBeLessThan(0.01);
    expect(minSouthDist).toBeLessThan(0.01);
  });
});