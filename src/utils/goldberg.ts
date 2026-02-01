import * as THREE from 'three';
import landData from './land.json';

export type CellType = 'pentagon' | 'hexagon';

export interface CellCoordinates {
  face: number;
  u: number;
  v: number;
}

export interface Cell {
  id: number;
  type: CellType;
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
  neighbors: number[];
  coordinates: CellCoordinates;
  isLand: boolean;
}

export interface GoldbergBoard {
  cells: Cell[];
  graph: Map<number, number[]>;
  pentagonCount: number;
  hexagonCount: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

export function pointInPolygon(point: [number, number], vs: number[][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInLand(pos: THREE.Vector3): boolean {
  // Orientation Fix: Consistent with Rust reference and to ensure East is Right
  const lon = Math.atan2(-pos.x, pos.z) * (180 / Math.PI);
  const lat = Math.asin(pos.y) * (180 / Math.PI);
  const point: [number, number] = [lon, lat];

  let inLand = false;
  let inLake = false;

  for (const feature of (landData as any).features) {
    const geometry = feature.geometry;
    const isLake = feature.properties.featurecla === 'Lake';
    
    if (geometry.type === 'Polygon') {
      if (isInPolygon(point, geometry.coordinates)) {
        if (isLake) inLake = true; else inLand = true;
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polyCoords of geometry.coordinates) {
        if (isInPolygon(point, polyCoords)) {
          if (isLake) inLake = true; else inLand = true;
        }
      }
    }
    // Optimization: if we found it's a lake, we know it's not land (lakes are 'holes' in our logic)
    if (inLake) return false;
  }
  return inLand;
}

export function isInPolygon(point: [number, number], rings: number[][][]): boolean {
  if (!pointInPolygon(point, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInPolygon(point, rings[i])) return false;
  }
  return true;
}

export function generateGoldberg(m: number, n: number): GoldbergBoard {
  const icoVertices: THREE.Vector3[] = [
    new THREE.Vector3(-1,  PHI,  0), new THREE.Vector3( 1,  PHI,  0),
    new THREE.Vector3(-1, -PHI,  0), new THREE.Vector3( 1, -PHI,  0),
    new THREE.Vector3( 0, -1,  PHI), new THREE.Vector3( 0,  1,  PHI),
    new THREE.Vector3( 0, -1, -PHI), new THREE.Vector3( 0,  1, -PHI),
    new THREE.Vector3( PHI,  0, -1), new THREE.Vector3( PHI,  0,  1),
    new THREE.Vector3(-PHI,  0, -1), new THREE.Vector3(-PHI,  0,  1)
  ];
  icoVertices.forEach(v => v.normalize());

  // Align a vertex to the North Pole (0, 1, 0) to ensure pentagons are at the poles
  const target = new THREE.Vector3(0, 1, 0);
  const alignQuat = new THREE.Quaternion().setFromUnitVectors(icoVertices[0], target);
  icoVertices.forEach(v => v.applyQuaternion(alignQuat));

  const icoFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  const B_grid = { u: m, v: n };
  const C_grid = { u: -n, v: m + n };
  const det = B_grid.u * C_grid.v - C_grid.u * B_grid.v;

  const minU = Math.min(0, m, -n);
  const maxU = Math.max(0, m, -n);
  const minV = Math.min(0, n, m + n);
  const maxV = Math.max(0, n, m + n);

  const gridPoints: {u: number, v: number}[] = [];
  const eps = 0.000001;
  for (let u = minU; u <= maxU; u++) {
    for (let v = minV; v <= maxV; v++) {
      const wB = (u * C_grid.v - v * C_grid.u) / det;
      const wC = (B_grid.u * v - B_grid.v * u) / det;
      const wA = 1 - wB - wC;
      if (wA >= -eps && wB >= -eps && wC >= -eps) {
        gridPoints.push({ u, v });
      }
    }
  }

  const uniqueCenters: THREE.Vector3[] = [];
  const centerMetadata: CellCoordinates[] = [];
  
  // Grid-based deduplication optimization
  const spatialBuckets = new Map<string, number[]>();
  const bucketSize = 0.05;

  icoFaces.forEach((face, faceIdx) => {
    const vA = icoVertices[face[0]];
    const vB = icoVertices[face[1]];
    const vC = icoVertices[face[2]];
    
    gridPoints.forEach(p => {
      const wB = (p.u * C_grid.v - p.v * C_grid.u) / det;
      const wC = (B_grid.u * p.v - B_grid.v * p.u) / det;
      const wA = 1 - wB - wC;
      const pos = new THREE.Vector3()
        .addScaledVector(vA, wA)
        .addScaledVector(vB, wB)
        .addScaledVector(vC, wC)
        .normalize();
      
      const bx = Math.floor(pos.x / bucketSize);
      const by = Math.floor(pos.y / bucketSize);
      const bz = Math.floor(pos.z / bucketSize);
      
      let found = false;
      for (let x = bx-1; x <= bx+1 && !found; x++) {
        for (let y = by-1; y <= by+1 && !found; y++) {
          for (let z = bz-1; z <= bz+1 && !found; z++) {
            const key = `${x},${y},${z}`;
            const bucket = spatialBuckets.get(key);
            if (bucket) {
              for (const idx of bucket) {
                if (uniqueCenters[idx].distanceTo(pos) < 0.005) {
                  found = true;
                  break;
                }
              }
            }
          }
        }
      }

      if (!found) {
        const newIdx = uniqueCenters.length;
        uniqueCenters.push(pos);
        centerMetadata.push({ face: faceIdx, u: p.u, v: p.v });
        const key = `${bx},${by},${bz}`;
        if (!spatialBuckets.has(key)) spatialBuckets.set(key, []);
        spatialBuckets.get(key)!.push(newIdx);
      }
    });
  });

  // Spatial optimization for neighbor finding
  const cells: Cell[] = uniqueCenters.map((center, i) => {
    const candidates: {idx: number, dist: number}[] = [];
    
    if (uniqueCenters.length < 500) {
      // Small board: exact O(N^2) search is fast and safe
      for (let j = 0; j < uniqueCenters.length; j++) {
        if (i === j) continue;
        candidates.push({ idx: j, dist: center.distanceTo(uniqueCenters[j]) });
      }
    } else {
      // Large board: spatial optimization
      const bx = Math.floor(center.x / bucketSize);
      const by = Math.floor(center.y / bucketSize);
      const bz = Math.floor(center.z / bucketSize);

      for (let x = bx-6; x <= bx+6; x++) {
        for (let y = by-6; y <= by+6; y++) {
          for (let z = bz-6; z <= bz+6; z++) {
            const key = `${x},${y},${z}`;
            const bucket = spatialBuckets.get(key);
            if (bucket) {
              for (const otherIdx of bucket) {
                if (i === otherIdx) continue;
                const d = center.distanceTo(uniqueCenters[otherIdx]);
                if (d < 0.4) candidates.push({ idx: otherIdx, dist: d });
              }
            }
          }
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);

    if (candidates.length < 5) {
       throw new Error(`Cell ${i} has only ${candidates.length} neighbors. Spatial search failed.`);
    }

    const neighbors = [candidates[0].idx, candidates[1].idx, candidates[2].idx, candidates[3].idx, candidates[4].idx];
    if (candidates[5] && candidates[5].dist < candidates[4].dist * 1.5) {
      neighbors.push(candidates[5].idx);
    }

    const up = center.clone();
    const arb = Math.abs(up.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, arb).normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();

    neighbors.sort((aIdx, bIdx) => {
      const a = uniqueCenters[aIdx].clone().sub(center);
      const b = uniqueCenters[bIdx].clone().sub(center);
      return Math.atan2(a.dot(forward), a.dot(right)) - Math.atan2(b.dot(forward), b.dot(right));
    });

    const vertices = neighbors.map((nIdx, k) => {
      const n1 = uniqueCenters[nIdx];
      const n2 = uniqueCenters[neighbors[(k + 1) % neighbors.length]];
      return new THREE.Vector3().add(center).add(n1).add(n2).normalize();
    });

    return {
      id: i,
      type: neighbors.length === 5 ? 'pentagon' : 'hexagon',
      center,
      vertices,
      neighbors,
      coordinates: centerMetadata[i],
      isLand: isPointInLand(center)
    };
  });

  const graph = new Map<number, number[]>();
  let pCount = 0;
  let hCount = 0;
  cells.forEach(c => {
    graph.set(c.id, c.neighbors);
    if (c.type === 'pentagon') pCount++; else hCount++;
  });

  return { cells, graph, pentagonCount: pCount, hexagonCount: hCount };
}
