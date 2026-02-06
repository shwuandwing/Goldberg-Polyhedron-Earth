import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as GoldbergUtils from './utils/goldberg';
import type { GoldbergBoard } from './utils/goldberg';
import React from 'react';

// Mock Three.js/Fiber to avoid WebGL context issues
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: () => ({ camera: { position: [0, 0, 0] }, size: { width: 100, height: 100 } }),
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
}));

// Mock the projection utils since they are used in App
vi.mock('./utils/projection', () => ({
  updateGeometryPositions: vi.fn(),
  projectTo2D: vi.fn(),
}));

describe('App Loading Flow', () => {
  it('shows loading screen before board generation completes', async () => {
    // 1. Setup the mock to return a dummy board
    const mockBoard: GoldbergBoard = {
      cells: [],
      graph: new Map(),
      pentagonCount: 0,
      hexagonCount: 0
    };

    const generateSpy = vi.spyOn(GoldbergUtils, 'generateGoldberg').mockReturnValue(mockBoard);

    // 2. Render the App
    render(<App />);

    // 3. Assert: Initial render should show the loading text
    // Because useEffect runs after render, the first frame is "Loading..."
    expect(screen.getByText(/Calculating Earth Topology/i)).toBeDefined();

    // 4. Assert: After effects run, we should see the main UI
    await waitFor(() => {
      expect(screen.getByText(/Geo-Goldberg Board/i)).toBeDefined();
    });

    // 5. Assert: Loading text should be gone
    expect(screen.queryByText(/Calculating Earth Topology/i)).toBeNull();

    generateSpy.mockRestore();
  });
});
