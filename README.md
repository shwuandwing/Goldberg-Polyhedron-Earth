# Goldberg Earth Visualization

A high-resolution 3D visualization of a Goldberg Polyhedron ($GP(25, 25)$) Earth with interactive pathfinding and geographical classification.

## Features

- **High-Resolution Generation**: Algorithmic generation of over 18,000 cells (hexagons and pentagons).
- **Geographical Accuracy**: Real-world landmass mapping using Natural Earth data.
- **Pathfinding Suite**:
  - **A* Search**: Fast, spatially-aware pathfinding using Euclidean heuristics.
  - **BFS**: Breadth-First Search for shortest cell-count paths.
- **Optimized Rendering**: Merged geometry approach for smooth 60fps performance at high cell counts.
- **Interactive UI**:
  - Algorithm selection toggle.
  - Precise cell picking with visual feedback (white highlight and center sphere).
  - Path reconstruction and length display.

## Visual Feedback

- **🌍 Land**: Dark Green
- **🌊 Ocean**: Deep Blue
- **🚩 Start Node**: Orange
- **📍 End Node**: Red
- **✨ Gold Path**: Golden Yellow
- **🖱️ Hover**: High-intensity White

## Tech Stack

- **Frontend**: React, TypeScript, Three.js (@react-three/fiber), Vite.
- **Rust (Internal Reference)**: Bevy 0.15 implementation for high-performance generation.

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

## Project Structure

- `src/utils/goldberg.ts`: Goldberg Polyhedron geometry and neighbor graph generation.
- `src/utils/pathfinding.ts`: Pathfinding implementations (BFS & A*).
- `src/App.tsx`: Main visualization component and interaction logic.
- `rust/`: Reference Bevy implementation.
