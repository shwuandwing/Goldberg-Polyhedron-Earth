import * as THREE from 'three';
import type { GoldbergBoard } from './goldberg';

// ------------------------------------------------------------------
// Constants & Configuration
// ------------------------------------------------------------------

const PHI = (1 + Math.sqrt(5)) / 2;
const H = Math.sqrt(3) / 2; // Height of unit equilateral triangle

// Reconstruct Icosahedron Vertices (matches goldberg.ts)
const icoVertices: THREE.Vector3[] = [
  new THREE.Vector3(-1,  PHI,  0), new THREE.Vector3( 1,  PHI,  0),
  new THREE.Vector3(-1, -PHI,  0), new THREE.Vector3( 1, -PHI,  0),
  new THREE.Vector3( 0, -1,  PHI), new THREE.Vector3( 0,  1,  PHI),
  new THREE.Vector3( 0, -1, -PHI), new THREE.Vector3( 0,  1, -PHI),
  new THREE.Vector3( PHI,  0, -1), new THREE.Vector3( PHI,  0,  1),
  new THREE.Vector3(-PHI,  0, -1), new THREE.Vector3(-PHI,  0,  1)
];
icoVertices.forEach(v => v.normalize());

// Align North Pole (matches goldberg.ts)
const target = new THREE.Vector3(0, 1, 0);
const alignQuat = new THREE.Quaternion().setFromUnitVectors(icoVertices[0], target);
icoVertices.forEach(v => v.applyQuaternion(alignQuat));

// Face Definitions (matches goldberg.ts)
const icoFaces = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];

// ------------------------------------------------------------------
// 2D Layout Logic
// ------------------------------------------------------------------

// Map Face Indices to 2D Triangle Configurations
// We use a predefined layout: 10 in a strip, 5 top, 5 bottom.
// Structure: [FaceIndex, TriangleType, GridX, GridY]
// TriangleType: 'UP' (point up) or 'DOWN' (point down)
// GridX: Horizontal step (0..9)
// GridY: Vertical step (0 for strip, 1 for top, -1 for bottom)

// Strip Sequence (Left to Right):
// 5(D), 15(U), 6(D), 16(U), 7(D), 17(U), 8(D), 18(U), 9(D), 19(U)
const stripIndices = [5, 15, 6, 16, 7, 17, 8, 18, 9, 19];

// North Caps (attached to Down triangles at Top Edge)
// 1 on 5, 0 on 6, 4 on 7, 3 on 8, 2 on 9.
const northIndices = [1, 0, 4, 3, 2];

// South Caps (attached to Up triangles at Bottom Edge)
// 10 on 15, 11 on 16, 12 on 17, 13 on 18, 14 on 19.
const southIndices = [10, 11, 12, 13, 14];

interface FaceTransform {
  p0: THREE.Vector2; // Corresponding to icoFaces[i][0]
  p1: THREE.Vector2; // Corresponding to icoFaces[i][1]
  p2: THREE.Vector2; // Corresponding to icoFaces[i][2]
}

const faceTransforms: FaceTransform[] = new Array(20);

function setFaceTransform(faceIdx: number, p0: THREE.Vector2, p1: THREE.Vector2, p2: THREE.Vector2) {
  faceTransforms[faceIdx] = { p0, p1, p2 };
}

// Helper to generate coordinates
// k is the horizontal slot index (0..9)
// type is 'UP' or 'DOWN'
// row is 0 (middle), 1 (top), -1 (bottom)

// Strip Generation
stripIndices.forEach((faceIdx, k) => {
  const isDown = k % 2 === 0; // Even k is Down (5, 6, 7, 8, 9)
  
  if (isDown) {
    // DOWN Triangle in Strip
    // Face 5: [1, 5, 9]. Determined: 1(TL), 5(TR), 9(B)
    // Vertices: TL(k/2, H), TR(k/2+1, H), B(k/2+0.5, 0)
    
    // We need to map the specific vertex indices.
    // Logic from thought process:
    // Face 5 [1, 5, 9] -> 1:TL, 5:TR, 9:B
    // Face 6 [5, 11, 4] -> 5:TL, 11:TR, 4:B (Attached to Face 0 [0, 11, 5])
    // Face 7 [11, 10, 2] -> 11:TL, 10:TR, 2:B
    // Face 8 [10, 7, 6] -> 10:TL, 7:TR, 6:B
    // Face 9 [7, 1, 8] -> 7:TL, 1:TR, 8:B
    
    // Generic Mapping for DOWN Strip Triangles:
    // icoFaces[faceIdx] = [vA, vB, vC]
    // vA -> TopLeft
    // vB -> TopRight
    // vC -> Bottom
    const pTL = new THREE.Vector2(k/2, H);
    const pTR = new THREE.Vector2(k/2 + 1, H);
    const pB  = new THREE.Vector2(k/2 + 0.5, 0);
    setFaceTransform(faceIdx, pTL, pTR, pB);
  } else {
    // UP Triangle in Strip
    // Face 15: [4, 9, 5]. Determined: 9(BL), 4(BR), 5(T)
    // Vertices: BL((k-1)/2 + 0.5, 0), BR((k-1)/2 + 1.5, 0), T((k-1)/2 + 1, H)
    
    // Mapping from thought process:
    // Face 15 [4, 9, 5] -> 9:BL, 4:BR, 5:T
    // Face 16 [2, 4, 11] -> 4:BL, 2:BR, 11:T
    // Face 17 [6, 2, 10] -> 2:BL, 6:BR, 10:T
    // Face 18 [8, 6, 7] -> 6:BL, 8:BR, 7:T
    // Face 19 [9, 8, 1] -> 8:BL, 9:BR, 1:T
    
    // Note: The order in icoFaces might not match exactly BL, BR, T.
    // Face 15 is [4, 9, 5]. We want 9->BL, 4->BR, 5->T.
    // So indices: 1->BL, 0->BR, 2->T.
    
    const pBL = new THREE.Vector2((k-1)/2 + 0.5, 0);
    const pBR = new THREE.Vector2((k-1)/2 + 1.5, 0);
    const pT  = new THREE.Vector2((k-1)/2 + 1, H);
    
    // Use switch/lookup or consistent ordering check?
    // Let's rely on the explicit list above.
    const f = icoFaces[faceIdx];
    // We set p0, p1, p2 corresponding to f[0], f[1], f[2]
    
    // Face 15 [4, 9, 5]: 4(BR), 9(BL), 5(T)
    if (faceIdx === 15) setFaceTransform(faceIdx, pBR, pBL, pT);
    // Face 16 [2, 4, 11]: 2(BR), 4(BL), 11(T)
    else if (faceIdx === 16) setFaceTransform(faceIdx, pBR, pBL, pT);
    // Face 17 [6, 2, 10]: 6(BR), 2(BL), 10(T)
    else if (faceIdx === 17) setFaceTransform(faceIdx, pBR, pBL, pT);
    // Face 18 [8, 6, 7]: 8(BR), 6(BL), 7(T)
    else if (faceIdx === 18) setFaceTransform(faceIdx, pBR, pBL, pT);
    // Face 19 [9, 8, 1]: 9(BR), 8(BL), 1(T)
    else if (faceIdx === 19) setFaceTransform(faceIdx, pBR, pBL, pT);
  }
});

// North Caps
northIndices.forEach((faceIdx, i) => {
  // Attached to Down Triangle at Strip index k = 2*i
  // Base at y=H. Tip at y=2H.
  // Vertices: BaseLeft(i, H), BaseRight(i+1, H), Tip(i+0.5, 2H)
  const pBL = new THREE.Vector2(i, H);
  const pBR = new THREE.Vector2(i+1, H);
  const pTip = new THREE.Vector2(i+0.5, 2*H);

  // Mapping:
  // Face 1 [0, 5, 1]: 0(Tip), 5(BR), 1(BL) -> p0=Tip, p1=BR, p2=BL
  // Face 0 [0, 11, 5]: 0(Tip), 11(BR), 5(BL) -> p0=Tip, p1=BR, p2=BL
  // Face 4 [0, 10, 11]: 0(Tip), 10(BR), 11(BL) -> p0=Tip, p1=BR, p2=BL
  // Face 3 [0, 7, 10]: 0(Tip), 7(BR), 10(BL) -> p0=Tip, p1=BR, p2=BL
  // Face 2 [0, 1, 7]: 0(Tip), 1(BR), 7(BL) -> p0=Tip, p1=BR, p2=BL
  
  setFaceTransform(faceIdx, pTip, pBR, pBL);
});

// South Caps
southIndices.forEach((faceIdx, i) => {
  // Attached to Up Triangle at Strip index k = 2*i + 1
  // Base at y=0. Tip at y=-H.
  // Vertices: BaseLeft(i+0.5, 0), BaseRight(i+1.5, 0), Tip(i+1, -H)
  const pBL = new THREE.Vector2(i+0.5, 0);
  const pBR = new THREE.Vector2(i+1.5, 0);
  const pTip = new THREE.Vector2(i+1, -H);

  // Mapping:
  // Face 10 [3, 9, 4]: 3(Tip), 9(BL), 4(BR) -> p0=Tip, p1=BL, p2=BR
  // Face 11 [3, 4, 2]: 3(Tip), 4(BL), 2(BR) -> p0=Tip, p1=BL, p2=BR
  // Face 12 [3, 2, 6]: 3(Tip), 2(BL), 6(BR) -> p0=Tip, p1=BL, p2=BR
  // Face 13 [3, 6, 8]: 3(Tip), 6(BL), 8(BR) -> p0=Tip, p1=BL, p2=BR
  // Face 14 [3, 8, 9]: 3(Tip), 8(BL), 9(BR) -> p0=Tip, p1=BL, p2=BR
  
  setFaceTransform(faceIdx, pTip, pBL, pBR);
});


// ------------------------------------------------------------------
// Projection Logic
// ------------------------------------------------------------------

// Reuse vectors to reduce GC
const _v0 = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _p = new THREE.Vector3();

const _bary = new THREE.Vector3(); // x=u, y=v, z=w
const _mat3 = new THREE.Matrix3();
const _vec3 = new THREE.Vector3();

// Gnomonic Barycentric Projection
// Projects point P onto the plane defined by triangle ABC along the ray from origin.
// This ensures that great circles on the sphere map to straight lines on the plane.
function computeBarycentricGnomonic(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, target: THREE.Vector3) {
  // We want to solve for weights w_a, w_b, w_c such that:
  // k * P = w_a * A + w_b * B + w_c * C
  // This is equivalent to solving the linear system M * W = P, then normalizing W.
  
  _mat3.set(
    a.x, b.x, c.x,
    a.y, b.y, c.y,
    a.z, b.z, c.z
  );
  
  // Invert matrix (M is invertible since A,B,C form a face of an icosahedron enclosing the origin)
  _mat3.invert();
  
  // Solve for raw weights: W = M_inv * P
  _vec3.copy(p).applyMatrix3(_mat3);
  
  // Normalize weights so they sum to 1
  const sum = _vec3.x + _vec3.y + _vec3.z;
  const invSum = 1.0 / sum;
  
  target.set(_vec3.x * invSum, _vec3.y * invSum, _vec3.z * invSum);
}

export function projectTo2D(point3D: THREE.Vector3, faceIdx: number, target: THREE.Vector3) {
  const f = icoFaces[faceIdx];
  const vA = icoVertices[f[0]];
  const vB = icoVertices[f[1]];
  const vC = icoVertices[f[2]];
  
  // Use Gnomonic projection to ensure straight grid lines
  computeBarycentricGnomonic(point3D, vA, vB, vC, _bary);
  
  const tf = faceTransforms[faceIdx];
  
  // Linear combination of 2D coordinates
  // target = u*p0 + v*p1 + w*p2
  target.x = _bary.x * tf.p0.x + _bary.y * tf.p1.x + _bary.z * tf.p2.x;
  target.y = _bary.x * tf.p0.y + _bary.y * tf.p1.y + _bary.z * tf.p2.y;
  target.z = 0;
  
  // Center map around origin for better camera centering
  // Flip X to match correct East-West orientation (consistent with 3D view)
  target.x = 2.5 - target.x;
}

export function updateGeometryPositions(
  geometry: THREE.BufferGeometry, 
  board: GoldbergBoard,
  mode: '3D' | '2D'
) {
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;
  const cellMap = (geometry.userData.cellMap) as Map<number, {start: number, count: number}>;
  
  const _tempPos = new THREE.Vector3();
  const _tempVert = new THREE.Vector3();

  // If 3D, we can just regenerate or restore?
  // Restoring from board data is safest as we might not store original state.
  
  board.cells.forEach(cell => {
    const mapping = cellMap.get(cell.id);
    if (!mapping) return;
    
    // For each triangle vertex in the fan
    // We reconstruct the fan from cell.vertices
    // This assumes the geometry layout matches createGlobeGeometry
    
    // Check createGlobeGeometry in rendering.ts:
    // Pushes center, then v1, then v2.
    
    const verts = cell.vertices;
    let idx = mapping.start * 3;
    
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];
      
      const points = [cell.center, v1, v2];
      
      for (const p of points) {
        if (mode === '2D') {
          projectTo2D(p, cell.coordinates.face, _tempPos);
          positions[idx++] = _tempPos.x;
          positions[idx++] = _tempPos.y;
          positions[idx++] = _tempPos.z;
        } else {
          positions[idx++] = p.x;
          positions[idx++] = p.y;
          positions[idx++] = p.z;
        }
      }
    }
  });
  
  posAttr.needsUpdate = true;
  geometry.computeBoundingSphere();
}
