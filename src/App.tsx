import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { generateGoldberg } from './utils/goldberg';
import type { GoldbergBoard, Cell } from './utils/goldberg';
import { findPath } from './utils/pathfinding';
import type { PathfindingAlgorithm } from './utils/pathfinding';
import './App.css';

const GoldbergGlobe = ({ 
  board, 
  startNode, 
  endNode, 
  path, 
  hoveredCell, 
  onCellClick, 
  onCellHover 
}: { 
  board: GoldbergBoard,
  startNode: number | null,
  endNode: number | null,
  path: number[],
  hoveredCell: Cell | null,
  onCellClick: (id: number) => void,
  onCellHover: (cell: Cell | null) => void
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Optimized path lookup
  const pathSet = useMemo(() => new Set(path), [path]);

  // Create merged geometries with cell IDs for perfect picking
  const { geometry, cellMap } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const cellIds: number[] = [];
    const map = new Map<number, { start: number, count: number }>();
    
    let currentVertex = 0;
    board.cells.forEach(cell => {
      const start = currentVertex;
      const center = cell.center;
      const verts = cell.vertices;
      
      // Build triangles for the cell
      for (let i = 0; i < verts.length; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % verts.length];
        
        positions.push(center.x, center.y, center.z);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
        
        for(let k=0; k<3; k++) {
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
  }, [board]);

  // Handle Dynamic Color Updates
  useEffect(() => {
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const colors = colorAttr.array as Float32Array;

    board.cells.forEach(cell => {
      const { start, count } = cellMap.get(cell.id)!;
      let r = 0.1, g = 0.35, b = 0.6; // Deep ocean

      if (cell.isLand) { r = 0.1, g = 0.45, b = 0.2; } // Lush land
      if (pathSet.has(cell.id)) { r = 1.0, g = 0.8, b = 0.0; } // Gold path
      if (cell.id === startNode) { r = 1.0, g = 0.5, b = 0.0; } // Start
      if (cell.id === endNode) { r = 1.0, g = 0.2, b = 0.2; } // End
      
      if (hoveredCell?.id === cell.id) {
         r = 1.0; g = 1.0; b = 1.0;
      }

      for (let i = 0; i < count; i++) {
        const idx = (start + i) * 3;
        colors[idx] = r;
        colors[idx + 1] = g;
        colors[idx + 2] = b;
      }
    });

    colorAttr.needsUpdate = true;
  }, [board, startNode, endNode, pathSet, hoveredCell, geometry, cellMap]);

  const getCellFromEvent = useCallback((e: any) => {
    const intersect = e.intersections && e.intersections[0];
    const faceIndex = intersect ? intersect.faceIndex : e.faceIndex;
    if (faceIndex === undefined) return null;
    const cellIdAttr = geometry.getAttribute('aCellId') as THREE.BufferAttribute;
    if (!cellIdAttr) return null;
    const id = cellIdAttr.getX(faceIndex * 3);
    return board.cells[id] || null;
  }, [geometry, board]);

  return (
    <group>
      <mesh 
        ref={meshRef} 
        geometry={geometry}
        onClick={(e) => {
          const cell = getCellFromEvent(e);
          if (cell) onCellClick(cell.id);
        }}
        onPointerMove={(e) => {
          const cell = getCellFromEvent(e);
          onCellHover(cell);
        }}
        onPointerOut={() => onCellHover(null)}
      >
        <meshStandardMaterial 
          vertexColors 
          side={THREE.FrontSide} 
        />
      </mesh>
      
      {hoveredCell && (
        <mesh position={hoveredCell.center.clone().multiplyScalar(1.001)}>
           <sphereGeometry args={[0.005, 16, 16]} />
           <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
};

function App() {
  const [board, setBoard] = useState<GoldbergBoard | null>(null);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>('AStar');

  useEffect(() => {
    const b = generateGoldberg(25, 25);
    setBoard(b);
  }, []);

  useEffect(() => {
    if (board && startNode !== null && endNode !== null) {
      const p = findPath(board.graph, startNode, endNode, algorithm, board.cells);
      setPath(p);
    } else {
      setPath([]);
    }
  }, [board, startNode, endNode, algorithm]);

  const handleCellClick = (id: number) => {
    if (startNode === null) {
      setStartNode(id);
    } else if (endNode === null) {
        if (id !== startNode) setEndNode(id);
    } else {
      setStartNode(id);
      setEndNode(null);
      setPath([]);
    }
  };

  if (!board) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111' }}>
        <h1 style={{ color: 'white', fontFamily: 'sans-serif' }}>Calculating Earth Topology...</h1>
    </div>
  );

  return (
    <>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(0,0,0,0.85)', padding: '20px', borderRadius: '12px', pointerEvents: 'none', minWidth: '240px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#2ecc71', fontSize: '1.4em' }}>Geo-Goldberg Board</h2>
        <div style={{ fontSize: '0.9em' }}>
            <p style={{ margin: '5px 0', color: 'white' }}>Resolution: GP(25, 25)</p>
            <p style={{ margin: '5px 0', color: 'white' }}>Cells: {board.cells.length.toLocaleString()}</p>
            
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            <div style={{ pointerEvents: 'auto', marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold', color: 'white' }}>Algorithm:</p>        
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setAlgorithm('BFS')}
                        style={{ flex: 1, padding: '6px', cursor: 'pointer', background: algorithm === 'BFS' ? '#2ecc71' : '#444', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        BFS
                    </button>
                    <button 
                        onClick={() => setAlgorithm('AStar')}
                        style={{ flex: 1, padding: '6px', cursor: 'pointer', background: algorithm === 'AStar' ? '#2ecc71' : '#444', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        A*
                    </button>
                </div>
            </div>

            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            
            <div style={{ height: '80px' }}>
                {hoveredCell ? (
                    <>
                        <p style={{ margin: '5px 0', fontWeight: 'bold', color: 'white' }}>Cell #{hoveredCell.id}</p>
                        <p style={{ margin: '5px 0', color: hoveredCell.isLand ? '#2ecc71' : '#3498db', fontWeight: 'bold' }}>
                           {hoveredCell.isLand ? '🌍 LAND' : '🌊 OCEAN'} 
                        </p>
                        <p style={{ margin: '5px 0', opacity: 0.7, color: 'white' }}>
                            F{hoveredCell.coordinates.face} ({hoveredCell.coordinates.u}, {hoveredCell.coordinates.v})
                        </p>
                    </>
                ) : <p style={{ color: '#888' }}>Hover to explore Earth...</p>}
            </div>
            
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            <p style={{ margin: '5px 0', color: 'white' }}>Start: {startNode ?? '---'}</p>
            <p style={{ margin: '5px 0', color: 'white' }}>End: {endNode ?? '---'}</p>
            {path.length > 0 && (
                <p style={{ margin: '10px 0', color: '#f1c40f', fontSize: '1.1em', fontWeight: 'bold' }}>
                    Path Length: {path.length} cells
                </p>
            )}
        </div>
        <div style={{ pointerEvents: 'auto', marginTop: '15px' }}>
            <button 
                onClick={() => { setStartNode(null); setEndNode(null); setPath([]); }}
                style={{ width: '100%', padding: '8px', cursor: 'pointer', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Reset Trip
            </button>
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 0, 6], fov: 25, near: 0.1, far: 100 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2.5} />
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#3498db" />
        <OrbitControls minDistance={1.1} maxDistance={10} makeDefault zoomSpeed={2} />
        <GoldbergGlobe 
          board={board}
          startNode={startNode}
          endNode={endNode}
          path={path}
          hoveredCell={hoveredCell}
          onCellClick={handleCellClick}
          onCellHover={setHoveredCell}
        />
      </Canvas>
    </>
  );
}

export default App;