import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import App from './App';
import * as GoldbergUtils from './utils/goldberg';

// Mock Three.js and React Three Fiber components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: () => ({ camera: { position: [0, 0, 0] }, size: { width: 100, height: 100 } }),
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
}));

// Mock generateGoldberg to return a tiny board for fast tests
vi.spyOn(GoldbergUtils, 'generateGoldberg').mockImplementation(() => {
  return {
    cells: Array.from({ length: 12 }, (_, i) => ({
      id: i,
      type: 'pentagon' as const,
      center: new THREE.Vector3(0, 0, 0),
      vertices: [],
      neighbors: [],
      coordinates: { face: 0, u: 0, v: 0 },
      isLand: false
    })),
    graph: new Map(),
    pentagonCount: 12,
    hexagonCount: 0
  };
});

describe('App Component', () => {
  it('renders the UI panel after the board is generated', async () => {
    render(<App />);
    
    // Board generation is effectively instant with the mock
    const title = await screen.findByText(/Geo-Goldberg Board/i);
    expect(title).toBeDefined();
    expect(screen.getByText(/Resolution: GP\(43, 0\)/i)).toBeDefined();
    expect(screen.getByText(/Cells: 12/i)).toBeDefined();
  });

  it('toggles pathfinding algorithms', async () => {
    render(<App />);
    await screen.findByText(/Geo-Goldberg Board/i);

    const bfsButton = screen.getByRole('button', { name: /BFS/i });
    const astarButton = screen.getByRole('button', { name: /A\*/i });

    // Initial state check (A* should be active by default)
    // Note: Vitest/JSDOM might use different string formatting for colors
    expect(astarButton.style.backgroundColor).toContain('rgb(46, 204, 113)');

    fireEvent.click(bfsButton);
    expect(bfsButton.style.backgroundColor).toContain('rgb(46, 204, 113)');
    expect(astarButton.style.backgroundColor).toContain('rgb(68, 68, 68)');
  });

  it('resets the trip when the Reset Trip button is clicked', async () => {
    render(<App />);
    await screen.findByText(/Geo-Goldberg Board/i);

    const resetButton = screen.getByRole('button', { name: /Reset Trip/i });
    fireEvent.click(resetButton);

    expect(screen.getByText(/Start: ---/i)).toBeDefined();
    expect(screen.getByText(/End: ---/i)).toBeDefined();
  });
});
