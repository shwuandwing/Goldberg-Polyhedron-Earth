import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { generateGoldberg } from './utils/goldberg';
import type { GoldbergBoard, Cell } from './utils/goldberg';
import { findPath } from './utils/pathfinding';
import type { PathfindingAlgorithm } from './utils/pathfinding';
import { createGlobeGeometry, updateColors } from './utils/rendering';
import { updateGeometryPositions, projectTo2D } from './utils/projection';
import './App.css';

const CameraController = ({ viewMode }: { viewMode: '3D' | '2D' }) => {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (viewMode === '2D') {
      // Reset camera to look straight at the map center
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
      
      if (controls) {
        // Reset orbit target to center
        (controls as any).target.set(0, 0, 0);
        (controls as any).update();
        // Disable rotation to keep it "2D"
        (controls as any).enableRotate = false;
      }
    } else {
      // 3D Mode
      if (controls) {
        (controls as any).enableRotate = true;
      }
    }
  }, [viewMode, camera, controls]);

  return null;
};

const GoldbergGlobe = ({ 
  board, 
  startNode, 
  endNode, 
  path, 
  hoveredCell, 
  onCellClick, 
  onCellHover,
  viewMode
}: { 
  board: GoldbergBoard,
  startNode: number | null,
  endNode: number | null,
  path: number[],
  hoveredCell: Cell | null,
  onCellClick: (id: number) => void,
  onCellHover: (cell: Cell | null) => void,
  viewMode: '3D' | '2D'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Optimized path lookup
  const pathSet = useMemo(() => new Set(path), [path]);

  // Create merged geometries with cell IDs for perfect picking
  const { geometry, cellMap } = useMemo(() => createGlobeGeometry(board), [board]);

  // Handle View Mode Changes (3D <-> 2D)
  useEffect(() => {
    updateGeometryPositions(geometry, board, viewMode);
  }, [geometry, board, viewMode]);

  // Handle Dynamic Color Updates
  useEffect(() => {
    updateColors({
      board,
      geometry,
      cellMap,
      startNode,
      endNode,
      pathSet,
      hoveredCellId: hoveredCell?.id ?? null
    });
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

  // Calculate hover highlight position
  const hoverPos = useMemo(() => {
    if (!hoveredCell) return null;
    if (viewMode === '2D') {
        const p = new THREE.Vector3();
        projectTo2D(hoveredCell.center, hoveredCell.coordinates.face, p);
        p.z += 0.05; // Lift slightly above plane
        return p;
    }
    return hoveredCell.center.clone().multiplyScalar(1.001);
  }, [hoveredCell, viewMode]);

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
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {hoverPos && (
        <mesh position={hoverPos}>
           <sphereGeometry args={[0.005, 16, 16]} />
           <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
};

function App({ m = 43, n = 0 }: { m?: number, n?: number }) {
  const [board, setBoard] = useState<GoldbergBoard | null>(null);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>('AStar');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  useEffect(() => {
    // Defer generation to allow UI to paint "Calculating..."
    const timer = setTimeout(() => {
      const b = generateGoldberg(m, n);
      setBoard(b);
    }, 50);
    return () => clearTimeout(timer);
  }, [m, n]);

  useEffect(() => {
    if (board && startNode !== null && endNode !== null) {
      const p = findPath(board.graph, startNode, endNode, algorithm, board.cells, m);
      setPath(p);
    } else {
      setPath([]);
    }
  }, [board, startNode, endNode, algorithm, m]);

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
            <p style={{ margin: '5px 0', color: 'white' }}>Resolution: GP({m}, {n})</p>
            <p style={{ margin: '5px 0', color: 'white' }}>Cells: {board.cells.length.toLocaleString()}</p>
            
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            
            <div style={{ pointerEvents: 'auto', marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold', color: 'white' }}>View Mode:</p>        
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setViewMode('3D')}
                        style={{ flex: 1, padding: '6px', cursor: 'pointer', background: viewMode === '3D' ? '#3498db' : '#444', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        3D Globe
                    </button>
                    <button 
                        onClick={() => setViewMode('2D')}
                        style={{ flex: 1, padding: '6px', cursor: 'pointer', background: viewMode === '2D' ? '#3498db' : '#444', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        2D Map
                    </button>
                </div>
            </div>

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
        <CameraController viewMode={viewMode} />
        <GoldbergGlobe 
          board={board}
          startNode={startNode}
          endNode={endNode}
          path={path}
          hoveredCell={hoveredCell}
          onCellClick={handleCellClick}
          onCellHover={setHoveredCell}
          viewMode={viewMode}
        />
      </Canvas>
    </>
  );
}

export default App;