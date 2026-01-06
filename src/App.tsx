import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { generateGoldberg } from './utils/goldberg';
import type { GoldbergBoard, Cell } from './utils/goldberg';
import { findPath } from './utils/pathfinding';
import './App.css';

const CellMesh = ({ 
  cell, 
  color, 
  onClick, 
  onHover,
  isPath 
}: { 
  cell: Cell, 
  color: string, 
  onClick: () => void, 
  onHover: () => void,
  isPath: boolean 
}) => {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const center = cell.center;
    const verts = cell.vertices;
    for (let i = 0; i < verts.length; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % verts.length];
        positions.push(center.x, center.y, center.z);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [cell]);

  const lineGeometry = useMemo(() => {
    const pts = [...cell.vertices, cell.vertices[0]];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [cell]);

  const scale = isPath ? 1.05 : 1;

  return (
    <group scale={scale}>
      <mesh 
        geometry={geometry} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
      >
        <meshStandardMaterial color={color} side={THREE.DoubleSide} flatShading />
      </mesh>
      {/* Using primitive to avoid SVG <line> name conflict */}
      <primitive object={new THREE.LineLoop(lineGeometry, new THREE.LineBasicMaterial({ color: 'black', transparent: true, opacity: 0.2 }))} />
    </group>
  );
};

function App() {
  const [board, setBoard] = useState<GoldbergBoard | null>(null);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [path, setPath] = useState<number[]>([]);

  useEffect(() => {
    const b = generateGoldberg(20, 20);
    setBoard(b);
  }, []);

  useEffect(() => {
    if (board && startNode !== null && endNode !== null) {
      const p = findPath(board.graph, startNode, endNode);
      setPath(p);
    } else {
      setPath([]);
    }
  }, [board, startNode, endNode]);

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
            <p style={{ margin: '5px 0' }}>Resolution: GP(5, 5)</p>
            <p style={{ margin: '5px 0' }}>Hexagons: {board.hexagonCount} | Pentagons: {board.pentagonCount}</p>
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            
            <div style={{ height: '80px' }}>
                {hoveredCell ? (
                    <>
                        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Cell #{hoveredCell.id}</p>
                        <p style={{ margin: '5px 0', color: hoveredCell.isLand ? '#2ecc71' : '#3498db', fontWeight: 'bold' }}>
                           {hoveredCell.isLand ? '🌍 LAND' : '🌊 OCEAN'} 
                        </p>
                        <p style={{ margin: '5px 0', opacity: 0.7 }}>
                            F{hoveredCell.coordinates.face} ({hoveredCell.coordinates.u}, {hoveredCell.coordinates.v})
                        </p>
                    </>
                ) : <p style={{ color: '#888' }}>Hover to explore Earth...</p>}
            </div>
            
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            <p style={{ margin: '5px 0' }}>Start: {startNode ?? '---'}</p>
            <p style={{ margin: '5px 0' }}>End: {endNode ?? '---'}</p>
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
      
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <OrbitControls />
        <group rotation={[0, 0, 0]}>
          {board.cells.map((cell) => {
            const isStart = cell.id === startNode;
            const isEnd = cell.id === endNode;
            const isPath = path.includes(cell.id);
            const isHovered = hoveredCell?.id === cell.id;

            let color = cell.isLand ? '#1e8449' : '#2874a6';
            
            if (isPath) color = '#f1c40f'; 
            if (isStart) color = '#f39c12';
            if (isEnd) color = '#e74c3c';
            if (isHovered && !isStart && !isEnd) color = '#ffffff';

            return (
              <CellMesh 
                key={cell.id} 
                cell={cell} 
                color={color} 
                onClick={() => handleCellClick(cell.id)} 
                onHover={() => setHoveredCell(cell)}
                isPath={isPath || isHovered}
              />
            );
          })}
        </group>
      </Canvas>
    </>
  );
}

export default App;