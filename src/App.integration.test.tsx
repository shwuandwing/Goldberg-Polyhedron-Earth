import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock Three.js to avoid WebGL errors in JSDOM, 
// but allow other logic (like generateGoldberg) to run naturally.
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: () => ({ camera: { position: [0, 0, 0] }, size: { width: 100, height: 100 } }),
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
}));

// We do NOT mock goldberg.ts or rendering.ts here. 
// We want to test the actual generation integration.

describe('App Integration', () => {
  it('renders loading screen then globe controls with a real (small) board', async () => {
    // Render App with a very small GP(2,0) board for speed
    render(<App m={2} n={0} />);

    // 1. Check Loading Screen
    expect(screen.getByText(/Calculating Earth Topology/i)).toBeDefined();

    // 2. Wait for Generation to Complete
    // Since we are running the real algorithm, this might take a few milliseconds.
    await waitFor(() => {
      // Look for the "Resolution: GP(2, 0)" text which confirms board is generated
      expect(screen.getByText(/Resolution: GP\(2, 0\)/i)).toBeDefined();
    }, { timeout: 3000 });

    // 3. Verify UI Elements are present
    expect(screen.getByText(/View Mode:/i)).toBeDefined();
    expect(screen.getByText(/Algorithm:/i)).toBeDefined();
    
    // 4. Verify Canvas is rendered
    expect(screen.getByTestId('canvas')).toBeDefined();
  });
});
