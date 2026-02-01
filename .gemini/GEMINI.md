# Gemini Project Memory: Goldberg Earth

## Project Identity
- **Context**: High-resolution Goldberg Polyhedron Earth visualization.
- **Core Parameters**: $GP(43, 0)$, ~18,492 cells.
- **Tech Stack**: Rust (Bevy 0.15) and TypeScript (React/Three.js).

## Architecture Decisions
- **Rendering Optimization (TS)**: All cells are merged into a single `BufferGeometry` to minimize draw calls. Direct buffer attribute manipulation is used for hover/path colors.
- **Orientation Fix**: Lon/lat calculation uses `-pos.x` in `atan2` to ensure East is right and West is left, matching right-handed coordinate systems.
- **Deduplication**: 3D spatial hashing (buckets) is used for vertex merging and neighbor finding. Increased search radius ensures stability at high resolutions.
- **Geography**: Points are classified as Land/Ocean via ray-casting against a GeoJSON landmass dataset.
- **Pathfinding**: Supports both Breadth-First Search (BFS) and A* Search (using Euclidean distance as an admissible heuristic).

## Current State
- **Rust Version**: High-performance reference implementation using Bevy.
- **TypeScript Version**: Reached parity with (and exceeds initial) resolution ($GP(43,0)$) and performance (via geometry merging).
- **UI**: Includes algorithm toggles (BFS vs A*) and high-fidelity interaction feedback.

## Technical Nuances
- **Picking**: Uses `aCellId` vertex attribute for perfect picking accuracy in merged geometry.
- **Visuals**: Smooth shading is enabled; cell outlines were removed to eliminate illusory Moire patterns at high cell densities.
- **Parallelism**: Rust version uses `rayon` for generation; TS version relies on optimized spatial buckets.