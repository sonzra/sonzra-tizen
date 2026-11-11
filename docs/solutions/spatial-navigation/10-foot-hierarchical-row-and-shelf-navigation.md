---
title: "10-Foot Hierarchical Row and Shelf Spatial Navigation"
category: "spatial-navigation"
date: "2026-11-10"
tags: ["tizen", "spatial-navigation", "focus-trap", "10-foot-ui", "tv-remote"]
---

# 10-Foot Hierarchical Row and Shelf Spatial Navigation

## Problem
In a 10-foot Smart TV application with both fixed UI overlays (persistent left sidebar rail and persistent bottom player dock) and scrollable content shelves (Hero actions, Continue Listening shelf, Recently Added shelf), global 2D Euclidean distance algorithms (`findNearestNeighbor`) cause severe focus traps:
1. **The Hero-to-Dock Focus Trap:** Elements in lower content shelves start lower down in the scroll container ($y > 900\text{px}$). Fixed bottom dock controls sit at $y \approx 984\text{px}-1080\text{px}$. When pressing **Down** from the hero action bar ($y \approx 500\text{px}$), the Euclidean distance to the fixed bottom dock was smaller than to partially scrolled offscreen shelf cards.
2. **The Unbreakable Reverse Trap:** Once inside the bottom dock, pressing **Up** disqualified the shelves because their coordinate centers were offscreen ($y > 1020\text{px}$). The only candidate physically above the dock was the hero favorite button. Up/Down formed an infinite two-node trap!
3. **Sidebar Rail Isolation:** Pressing Left on leftmost cards had no deterministic target to enter the left navigation rail.

---

## Solution
Implemented a 10-foot hierarchical row-and-shelf navigation engine in `src/navigation/spatialMath.ts` and `src/navigation/SpatialNavigationContext.tsx`:

1. **Semantic Group Attribution:** Every focusable node is tagged with a group (`sidebar`, `bottom-dock`, `hero-actions`, `continue-shelf`, `recent-shelf`, `library-tabs`, `library-grid`, etc.).
2. **Ordered Shelf Transitions:**
   - From `hero-actions`: **Down** always transitions to `continue-shelf` (matching horizontal center X).
   - From `continue-shelf`: **Down** always transitions to `recent-shelf`; **Up** returns to `hero-actions`.
   - From `recent-shelf`: **Down** transitions to `bottom-dock`; **Up** returns to `continue-shelf`.
   - From `bottom-dock`: **Up** restores focus to the last-focused content element or active shelf, never jumping to the hero.
3. **Left Rail Escape:** When pressing **Left** on any leftmost element (Card 0, Tab 0, Column 0, or `dock-track-info`), the algorithm smoothly transitions directly into the active item in the `<Sidebar />` rail.
4. **Viewport Auto-Centering:** Replaced `block: 'nearest'` with `block: 'center'` and added `scrollPaddingBottom: 140px` and `pb-44` to the main scroll container, ensuring focused shelves center smoothly with full clearance above the bottom dock.

---

## Verification
- Added 10 automated test cases in `src/navigation/__tests__/spatialMath.test.ts`.
- Verified live on Samsung 65" Neo QLED TV (`TQ65QN80FAUXXC`, Tizen 9.0) with zero focus traps across all remote D-pad directions.
