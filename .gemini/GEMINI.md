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

- **Dual View**: Supports 3D Globe and 2D Unfolded Net views with seamless transitions.

- **UI**: Includes algorithm toggles (BFS vs A*), view mode toggles, and high-fidelity interaction feedback.



## Technical Nuances

- **Picking**: Uses `aCellId` vertex attribute for perfect picking accuracy in merged geometry.

- **2D Projection**: Implements Gnomonic Barycentric projection. This preserves geodesic straightness, meaning A* paths look like straight lines on the flat map.

- **Pathfinding**: A* uses dynamic heuristic scaling based on $m$ (scale factor $\approx \frac{4m}{2\pi}$) to prioritize the Great Circle route over broad BFS-style expansion.

- **Camera**: Custom `CameraController` resets and locks the view in 2D mode to prevent perspective distortion.

- **Parallelism**: Rust version uses `rayon` for generation; TS version relies on optimized spatial buckets.
