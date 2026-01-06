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

  it('can generate a GP(25,25) board without neighbor errors', () => {
    // This is the resolution used in the app. 
    // We want to ensure it doesn't throw the "Spatial search failed" error.
    const board = generateGoldberg(25, 25);
    expect(board.cells.length).toBe(18752);
        expect(board.pentagonCount).toBe(12);
      });
    
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
    });
    