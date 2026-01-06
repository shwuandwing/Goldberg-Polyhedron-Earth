# Goldberg Earth (Rust + Bevy)

A high-performance 3D Earth visualization using a Goldberg Polyhedron grid ($m=20, n=20$) with real-world geographical data and interactive pathfinding.

## Technical Specifications

- **Grid Resolution**: GP(20, 20) Class II.
- **Total Cells**: 12,002 (11,990 Hexagons, 12 Pentagons).
- **Engine**: Bevy 0.15 (ECS-based).
- **Language**: Rust 2021 Edition.
- **Data Source**: Natural Earth 110m GeoJSON landmasses.

## Features

- **Parallel Generation**: Uses `rayon` to classify 12,000+ cells against global geography in parallel.
- **Spatial Optimization**: 3D bucket-based spatial hashing for $O(N)$ neighbor searching.
- **Robust Interaction**: Math-accurate ray-sphere intersection for cell picking.
- **Pathfinding**: Optimized BFS implementation on the polyhedron adjacency graph.

## Getting Started

### Prerequisites
- [Rust Toolchain](https://rustup.rs/)

### Setup & Run
1. Navigate to the rust directory:
   ```bash
   cd rust
   ```
2. Run in release mode (highly recommended for high cell counts):
   ```bash
   cargo run --release
   ```

## Controls
- **Left Click + Drag**: Orbit the globe.
- **Mouse Hover**: View cell data in the UI dashboard.
- **Right Click**: 
  - 1st Click: Select Start Node.
  - 2nd Click: Select End Node & Calculate Path.
  - 3rd Click: Reset and start new selection.

## Project Structure
- `src/main.rs`: Bevy app setup, UI systems, and interaction logic.
- `src/goldberg.rs`: Geometry generation, spatial optimization, and landmass classification.
- `assets/land.json`: Bundled GeoJSON data.
