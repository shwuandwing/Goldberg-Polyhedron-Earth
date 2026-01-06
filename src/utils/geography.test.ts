import { describe, it, expect } from 'vitest';
import { isPointInLand } from './goldberg';
import * as THREE from 'three';

describe('Geography Logic', () => {
  it('identifies Australia as land', () => {
    // Australia is roughly around 25S, 135E
    const lat = -25 * (Math.PI / 180);
    const lon = 135 * (Math.PI / 180);
    const pos = new THREE.Vector3(
      -Math.sin(lon) * Math.cos(lat),
      Math.sin(lat),
      Math.cos(lon) * Math.cos(lat)
    );
    expect(isPointInLand(pos)).toBe(true);
  });

  it('identifies Central Pacific as ocean', () => {
    // 0N, 160W
    const lat = 0;
    const lon = -160 * (Math.PI / 180);
    const pos = new THREE.Vector3(
      -Math.sin(lon) * Math.cos(lat),
      Math.sin(lat),
      Math.cos(lon) * Math.cos(lat)
    );
    expect(isPointInLand(pos)).toBe(false);
  });

  it('identifies Antarctica as land', () => {
    const southPole = new THREE.Vector3(0, -1, 0);
    expect(isPointInLand(southPole)).toBe(true);
  });

  it('handles the Prime Meridian/Equator intersection correctly (Ocean)', () => {
    const pos = new THREE.Vector3(0, 0, 1);
    expect(isPointInLand(pos)).toBe(false);
  });

  it('handles the Date Line/Equator intersection correctly (Ocean)', () => {
    const pos = new THREE.Vector3(0, 0, -1);
    expect(isPointInLand(pos)).toBe(false);
  });
});