# Sphere Pathfinding

A 3D visualization of a Goldberg Polyhedron (Class II, m=3, n=3) with interactive pathfinding.

## Features

- **Goldberg Polyhedron Generation**: Generates a GP(3,3) mesh algorithmically.
- **Pathfinding**: BFS implementation to find shortest paths between cells.
- **Interactive 3D Board**: Click to select start and end cells.
- **Visual Feedback**:
  - Yellow: Start Node
  - Red: End Node
  - Green: Path
  - Cyan: Hexagons
  - Salmon: Pentagons

## Tech Stack

- React
- TypeScript
- Three.js (@react-three/fiber)
- Vite

## How to Run

1. Install dependencies (if not done):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the link (usually http://localhost:5173).

## Project Structure

- `src/utils/goldberg.ts`: Core logic for generating the polyhedron geometry and graph.
- `src/utils/pathfinding.ts`: BFS algorithm.
- `src/App.tsx`: Main React component for visualization and state.