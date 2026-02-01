# Architecture: Goldberg Polyhedron Earth

This project implements a high-resolution, interactive Earth globe using a Goldberg Polyhedron grid.

## Core Components

### 1. Goldberg Geometry Generation (`src/utils/goldberg.ts`)
- **Icosahedron Basis**: Starts with a standard 20-faced icosahedron defined by 12 vertices.
- **Subdivision**: Each triangular face is subdivided into a grid based on parameters $(m, n)$.
- **Resolution**: This project uses $GP(43, 0)$ (Class 1), resulting in exactly 18,492 cells (12 pentagons and 18,480 hexagons).
- **Spatial Optimization**: Uses 3D spatial hashing (bucket system) to deduplicate vertices and find neighbors efficiently. The neighbor search radius is tuned to ensure connectivity at high resolutions.
- **Deduplication**: Points are merged if they are within $0.005$ units on a unit sphere.

### 2. Geographical Classification
- **Dataset**: Uses Natural Earth's 110m land and lake dataset.
- **Logic**: Every cell center is mapped to Latitude/Longitude.
- **Exclusion**: Lakes are specifically identified and classified as "Ocean" (Water) to provide accurate shorelines (e.g., Great Lakes, Caspian Sea).
- **Polar Regions**: Correctly identifies Antarctica as land and the North Pole as water.

### 3. Pathfinding (`src/utils/pathfinding.ts`)
- **BFS**: Standard Breadth-First Search for shortest hop-count paths.
- **A* Search**: Optimized pathfinding using Euclidean distance as an admissible heuristic. A* is significantly faster for long-distance paths across the 18k+ cell graph.

### 4. Optimized Rendering (`src/utils/rendering.ts` & `src/utils/projection.ts`)
- **Geometry Merging**: All 18,492 cells are merged into a single `BufferGeometry` to minimize draw calls and maximize GPU throughput.
- **2D Projection**:
  - Uses a **Gnomonic Barycentric Projection** to unfold the icosahedron faces onto a flat zigzag net.
  - This specific projection ensures that Great Circle paths (geodesics) on the sphere map to straight lines on the 2D plane.
  - Vertices are dynamically updated in the GPU buffer when switching modes via `updateGeometryPositions`.
- **Camera Management**: 
  - Switching to 2D mode triggers a camera reset and rotation lock to ensure the map is viewed as a flat, correctly oriented plane.
- **Vertex Attributes**: 
  - `position`: Triangle vertices for all cells.
  - `color`: Vertex colors updated dynamically via `updateColors`.
  - `aCellId`: A custom attribute storing the cell ID for every vertex, allowing for $O(1)$ picking in the fragment shader/picking logic.
- **Color Priorities**: Colors are applied in a strict priority order: Hover > End Node > Start Node > Path > Terrain (Land/Ocean).

### 5. UI & Interaction (`src/App.tsx`)
- **React Three Fiber**: Orchestrates the Three.js scene.
- **Decoupled Logic**: The component is "thin," delegating geometry creation and color updates to pure utility functions, which allows for 100% unit test coverage of the rendering logic.

## Mathematical Formulas

- **Triangulation Number ($T$):** $T = m^2 + mn + n^2$
- **Total Cells ($F$):** $10(T - 1) + 12$
- For $(43, 0)$: $T = 1849$, Total Cells = $10(1848) + 12 = 18,492$.