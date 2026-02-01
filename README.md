# Goldberg Earth Visualization

A high-resolution 3D visualization of a Goldberg Polyhedron ($GP(43, 0)$) Earth with interactive pathfinding and geographical classification.

## Features

- **High-Resolution Generation**: Algorithmic generation of over 18,000 cells (hexagons and pentagons).
- **Dual View Modes**:
  - **🌍 3D Globe**: Spherical Earth with correct orientation (East is Right).
  - **🗺️ 2D Map**: Unfolded icosahedral net using Gnomonic projection to preserve straight-line geodesics.
- **Geographical Accuracy**: Real-world landmass mapping using Natural Earth data.
- **Pathfinding Suite**:
  - **A* Search**: Fast, spatially-aware pathfinding. Now uses dynamic heuristic scaling based on grid resolution ($m$) to strictly follow Great Circle routes.
  - **BFS**: Breadth-First Search for shortest cell-count paths.
- **Optimized Rendering**: Merged geometry approach for smooth 60fps performance at high cell counts.
- **Interactive UI**:
  - View mode toggle (3D vs 2D).
  - Algorithm selection toggle.
  - Precise cell picking with visual feedback (white highlight and center sphere).
  - Automatic camera resetting and rotation locking in 2D mode.

## Visual Feedback

- **🌍 Land**: Dark Green
- **🌊 Ocean**: Deep Blue
- **🚩 Start Node**: Orange
- **📍 End Node**: Red
- **✨ Gold Path**: Golden Yellow
- **🖱️ Hover**: High-intensity White

## Tech Stack

- **Frontend**: React, TypeScript, Three.js (@react-three/fiber), Vite.

## How to Run (TypeScript App)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the browser to the link provided (e.g., `http://localhost:5173`).

## Testing

The project includes a comprehensive test suite covering geometry, geography, pathfinding, and rendering logic.

### Unit Tests (Vitest)
```bash
npm test
```
Tests include:
- **Geometry**: Euler characteristics, neighbor reciprocity, and $GP(43,0)$ consistency.
- **Geography**: Polar classification, major landmass checks, and lake exclusion.
- **Pathfinding**: BFS vs A* hop-count parity and disconnection handling.
- **Rendering**: Face-to-cell ID mapping and color priority.

### Visual Verification (Playwright)
```bash
node verify_world.js
```
Captures screenshots of key landmarks (Prime Meridian, Poles, Bering Strait) to ensure correct orientation and hover states.

## Project Structure

- `src/utils/goldberg.ts`: Goldberg Polyhedron geometry and neighbor graph generation.
- `src/utils/pathfinding.ts`: Pathfinding implementations (BFS & A*).
- `src/utils/rendering.ts`: Optimized BufferGeometry creation and color update logic.
- `src/App.tsx`: Main visualization component and interaction logic.

