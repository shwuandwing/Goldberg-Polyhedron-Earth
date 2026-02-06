# Goldberg Earth - Visual Verification Plan

This document outlines the procedure for verifying the geographical orientation and rendering accuracy of the Goldberg Polyhedron Earth visualization.

## Setup
1. Start the development server: `npm run dev`
2. Ensure the server is running on `http://localhost:5173/` (or update `verify_world.js`).
3. Run the verification scripts: `node verify_world.js; node verify_zoom.js; node verify_rotation_shape.js`

## Agent Verification Instruction
**IMPORTANT**: After running the scripts, the agent MUST use the `read_file` tool to inspect each generated PNG file in the `test_results/` folder and manually verify that the "Check" items in the "Verification Steps" below are met. The agent must report its findings for each image.

## Verification Steps

### 1. Global Orientation (Prime Meridian)
**File**: `01_Prime_Meridian.png`
- **Check**: The Atlantic Ocean should be centered.
- **Check**: Africa must be on the **Right** (East) of the Atlantic.
- **Check**: South America must be on the **Left** (West) of the Atlantic.
- **Fail Condition**: If South America is on the Right, the longitude is mirrored (atan2 x/z error).

### 2. Polar Accuracy (North Pole)
**File**: `02_North_Pole.png`
- **Action**: Look directly down at the North Pole.
- **Check**: Greenland should be positioned between Canada (West) and Northern Europe (East).
- **Check**: The landmass shapes should expand correctly outwards from the pole.

### 3. Pacific Alignment (Bering Strait)
**File**: `04_Bering_Strait.png`
- **Check**: Russia (Siberia) should be on the **Left** (West) of the strait.
- **Check**: Alaska should be on the **Right** (East) of the strait.
- **Check**: Australia and Indonesia should be visible in the lower-left quadrant.

### 4. Interactive Feedback
**File**: `05_Hover_State.png`
- **Check**: A white dot (sphere) should appear exactly at the center of the cell under the mouse cursor.
- **Check**: The cell itself should be highlighted in solid white.
- **Check**: The sidebar should display the correct Cell ID and classification (Land/Ocean).

### 5. Zoom & Clipping Verification
Run: `node verify_zoom.js`
**Files**: `zoom_02_in_deep.png`
- **Check**: No "double lines" or "hexagons inside hexagons" (Z-fighting between front/back faces).
- **Check**: No sudden "disappearing" landmasses when zooming in (Near-plane clipping).
- **Check**: Borders should remain clean and sharp even when very close to the surface.

### 6. Rotation Shape Stability
Run: `node verify_rotation_shape.js`
**Files**: `rotation_01_center.png`, `rotation_02_edge.png`
- **Check**: Compare the landmass (e.g., Australia) in both shots. It should maintain its relative proportions and not appear "stretched" or "flattened" as it approaches the horizon.
- **Check**: No "geometry popping" or parts of the world suddenly jumping into view during rotation.

## Automated Regression
The script `src/utils/rendering.test.ts` provides mathematical verification that the GPU buffer correctly maps to the internal data structure. This should be run after any changes to `generateGoldberg` or `GoldbergGlobe`:
```bash
npm test -- src/utils/rendering.test.ts
```
