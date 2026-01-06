# Architecture: Goldberg Polyhedron Earth

This project implements a high-resolution, interactive Earth globe using a Goldberg Polyhedron grid.

## Core Components

### 1. Goldberg Geometry Generation (`src/utils/goldberg.ts`)
- **Icosahedron Basis**: Starts with a standard 20-faced icosahedron.
- **Subdivision**: Each triangular face is subdivided into a hexagonal grid based on parameters $(m, n)$. For this project, we use $m=20, n=20$ (Class II).
- **Dual Construction**: The cells (hexagons/pentagons) are created by taking the dual of the subdivided icosahedron.
- **Spatial Optimization**: Uses 3D spatial hashing (bucket system) to deduplicate vertices and find neighbors in $O(N)$ time, supporting boards with over 12,000 cells.

### 2. Geographical Classification
- **GeoJSON Integration**: Uses Natural Earth's 110m land dataset.
- **Point-in-Polygon**: Every cell center is mapped to Latitude/Longitude and checked against the world's landmasses using a Ray Casting algorithm.
- **Coordinate System**: Each cell tracks its source Icosahedron face and local $(u, v)$ coordinates.

### 3. Pathfinding (`src/utils/pathfinding.ts`)
- Implements a Breadth-First Search (BFS) on the polyhedron graph.
- Optimized for the unweighted hexagonal grid to find the shortest path between any two global locations.

### 4. Visualization (`src/App.tsx`)
- Powered by **React Three Fiber** and **Three.js**.
- Each cell is rendered as a distinct mesh with custom coloring (Land: Green, Ocean: Blue, Path: Gold).
- Interactive controls via `OrbitControls`.

## Mathematical Formulas

- **Triangulation Number ($T$):** $T = m^2 + mn + n^2$
- **Total Cells ($F$):** $10(T - 1) + 12$
- For $(20, 20)$: $T = 1200$, Total Cells = $12,002$.
