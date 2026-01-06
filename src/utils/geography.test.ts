import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { pointInPolygon, isPointInLand } from './goldberg';

describe('Geography Logic', () => {
  describe('pointInPolygon', () => {
    it('returns true for a point inside a square', () => {
      const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
      expect(pointInPolygon([5, 5], square)).toBe(true);
    });

    it('returns false for a point outside a square', () => {
      const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
      expect(pointInPolygon([15, 5], square)).toBe(false);
    });

    it('handles concave polygons', () => {
      const concave = [[0, 0], [10, 0], [10, 10], [5, 5], [0, 10]];
      expect(pointInPolygon([5, 2], concave)).toBe(true);
      expect(pointInPolygon([5, 8], concave)).toBe(false);
    });
  });

  describe('isPointInLand', () => {
    // Helper to convert lat/lon to sphere position
    const lonLatToVector = (lon: number, lat: number): THREE.Vector3 => {
      const phi = lat * (Math.PI / 180);
      const theta = -lon * (Math.PI / 180); // Reverse of Math.atan2(-pos.x, pos.z)
      return new THREE.Vector3(
        Math.cos(phi) * Math.sin(theta),
        Math.sin(phi),
        Math.cos(phi) * Math.cos(theta)
      ).normalize();
    };

    it('correctly identifies land (London)', () => {
      const london = lonLatToVector(0.12, 51.5);
      expect(isPointInLand(london)).toBe(true);
    });

    it('correctly identifies land (Beijing)', () => {
      const beijing = lonLatToVector(116.4, 39.9);
      expect(isPointInLand(beijing)).toBe(true);
    });

    it('correctly identifies ocean (Pacific)', () => {
      const pacific = lonLatToVector(-150, 0);
      expect(isPointInLand(pacific)).toBe(false);
    });

    it('correctly identifies ocean (Atlantic)', () => {
      const atlantic = lonLatToVector(-30, 20);
      expect(isPointInLand(atlantic)).toBe(false);
    });
  });
});
