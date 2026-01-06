# Goldberg Earth Visualization - Issues Report

## Visual/Rendering Issues
1. **Low Visual Fidelity (Blockiness)**: The globe uses `flatShading`, which makes the 12,000 cells look like a faceted disco ball rather than a smooth sphere. While this is helpful for seeing individual cells, it lacks the "Earth" feel.
2. **Weak Hover Feedback**: In the `screenshot_hover.png`, the hovered cell (#8960) is barely distinguishable from its neighbors. The current "lighten" logic isn't strong enough.
3. **Black Outline Contrast**: The black cell outlines are very thin and sometimes disappear against the dark ocean colors at certain angles.

## Interactive Issues
1. **Picking Feedback**: While the UI panel updates correctly (showing Cell #8960, Ocean, etc.), there is no 3D "cursor" or glow on the cell itself to confirm *where* exactly the user is pointing.

## Proposed Fixes
- **Aesthetic**: Add a subtle `normalMap` or change shading to `smooth` (while keeping cell borders sharp) to improve the spherical look.
- **Selection**: Implement a "Selection Ring" or a much stronger emissive highlight for the hovered cell.
- **Resolution**: The GP(20, 20) resolution is high enough, but the coloring could be improved with a slight gradient.

**Should I proceed with fixing these visual and feedback issues?**
