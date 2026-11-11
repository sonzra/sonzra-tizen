---
title: "10-Foot Spatial Navigation Smooth Scroll Performance & GPU Acceleration on Tizen"
date: "2026-11-11"
category: "spatial-navigation"
module: "spatial-navigation"
problem_type: "performance_issue"
component: "frontend"
symptoms:
  - "Card-to-card navigation sluggishness and laggy transitions on physical Samsung TV"
  - "Frame drops during horizontal shelf scrolling due to redundant vertical viewport centering"
  - "Nested CSS transitions causing double rasterization overhead on low-power TV chips"
root_cause: "unbounded_smooth_scroll_and_nested_transitions"
resolution_type: "code_fix"
severity: "medium"
tags:
  - "tizen"
  - "spatial-navigation"
  - "performance"
  - "gpu-acceleration"
  - "scrollintoview"
  - "10-foot-ui"
---

# 10-Foot Spatial Navigation Smooth Scroll Performance & GPU Acceleration on Tizen

## Problem
On physical Samsung Smart TVs running Tizen 9.0 (e.g. Neo QLED `TQ65QN80FAUXXC`), moving the remote control D-pad horizontally between cards on content shelves exhibited noticeable latency (>300ms) and sluggish animations. Navigating from card to card felt heavy, non-responsive, and dropped frames.

## Symptoms
- Pressing Left/Right between cards on the same shelf triggered slow vertical recentering jitter.
- Visual focus transitions took 250ms to 400ms to settle on the next element.
- Lower-end TV SoC GPU cores struggled to rasterize cards during rapid focus changes.

## What Didn't Work
- Relying exclusively on global CSS `scroll-smooth` on `#tv-main-scroll-container`: this clashed with programmatic `element.scrollIntoView()` calls, causing conflicting interpolation and stuttering.
- Keeping `block: 'center'` on every focus event: when moving horizontally between cards within the same shelf, the target card was already fully visible vertically. Invoking `scrollIntoView` triggered unnecessary layout recalculations and smooth scrolling overhead on every horizontal hop.
- High CSS transition durations (`0.25s` on `.tv-focusable` and nested `transition-all duration-200` on inner card divs): multiple overlapping transition curves compounded the perceptible lag.

## Solution
Implemented a multi-tier performance optimization across the spatial navigation engine and CSS styling:

1. **Boundary-Guarded Vertical Viewport Centering (`src/navigation/SpatialNavigationContext.tsx`):**
   Before calling `scrollIntoView()`, inspect the element's bounding rect against the viewport's vertical overscan safe boundaries:
   ```typescript
   const rect = el.getBoundingClientRect();
   const viewHeight = window.innerHeight || 1080;
   const isComfortablyVisible = rect.top >= 80 && rect.bottom <= viewHeight - 130;

   // Only trigger scrollIntoView if the element is out of the safe visible vertical band
   if (!isComfortablyVisible) {
     el.scrollIntoView({
       behavior: 'smooth',
       block: 'nearest',
       inline: 'nearest'
     });
   }
   ```
   Horizontal shelf navigation now bypasses vertical scrolling entirely when cards are within safe vertical bounds.

2. **Removal of Conflicting CSS `scroll-smooth` (`src/App.tsx`):**
   Removed `scroll-smooth` class from the `#tv-main-scroll-container` to eliminate interpolation thrashing between the browser's CSS smooth-scrolling engine and the spatial navigation programmatic centering.

3. **Tightened Hardware-Accelerated Focus Ring (`src/index.css`):**
   - Reduced transition duration from `0.25s` down to `0.09s` (`ease-out`).
   - Added `transform: translateZ(0)` and `will-change: transform` to force a dedicated GPU compositing layer:
   ```css
   .tv-focusable {
     position: relative;
     transition: transform 0.09s ease-out, box-shadow 0.09s ease-out, border-color 0.09s ease-out;
     will-change: transform;
     transform: translateZ(0);
   }
   ```

4. **Eliminated Nested CSS Transitions (`src/views/HomeView.tsx`):**
   Removed nested `transition-all duration-200`, inner `scale-[1.03]`, and redundant inner drop-shadows on card container elements so only the root `.tv-focusable` element animates.

## Why This Works
1. TV system-on-chip (SoC) graphics units lack the raw rasterization throughput of desktop GPUs. Triggering `scrollIntoView` on every single remote button press forced continuous reflow and compositing across the entire document. Guarding with `rect.top >= 80 && rect.bottom <= viewHeight - 130` ensures zero scroll overhead during horizontal browsing.
2. Hardware compositing via `translateZ(0)` offloads focus scaling and shadow elevation directly to the TV GPU compositing plane without triggering repaint passes on the main browser thread.
3. 90ms transition curves match the human optical perception threshold for instant feedback while preserving the smooth radiant halo aesthetic.

## Prevention
- Never call unconditional `scrollIntoView` on focus change without checking if the element is already comfortably visible within safe overscan boundaries.
- Never nest CSS transitions or multiple `scale` transforms inside a `.tv-focusable` hierarchy.
- Always use `will-change: transform` and `translateZ(0)` on 10-foot TV focusable elements.
- Validate spatial navigation smoothness directly on physical TV hardware via `./deploy-tv.sh`.

## Related Issues
- `docs/solutions/spatial-navigation/10-foot-hierarchical-row-and-shelf-navigation.md`
