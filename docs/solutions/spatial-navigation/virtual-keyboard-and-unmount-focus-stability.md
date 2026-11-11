---
title: "Virtual Keyboard Re-render Focus Traps & Debounced Unmount Re-anchoring"
date: "2026-11-11"
category: "spatial-navigation"
module: "spatial-navigation"
problem_type: "ui_bug"
component: "frontend"
symptoms:
  - "Pressing Enter or Center button on virtual keyboard keys stole focus back to username field"
  - "Deleting characters with Backspace forced user to navigate back across keyboard on every keystroke"
  - "React Strict Mode double-mount and batched component unmount caused sequential focus hopping cascades"
root_cause: "unstable_callbacks_triggering_node_re-registration"
resolution_type: "code_fix"
severity: "high"
tags:
  - "tizen"
  - "spatial-navigation"
  - "virtual-keyboard"
  - "focus-trap"
  - "react-strictmode"
  - "unmount-cascade"
---

# Virtual Keyboard Re-render Focus Traps & Debounced Unmount Re-anchoring

## Problem
During 10-foot TV authentication on `<SignInView />`, two distinct focus traps occurred:
1. When navigating the on-screen virtual keyboard and pressing **Enter (Center button)** on character keys or `[BACKSPACE]`, input focus immediately jumped away from the keyboard back to the `email` text input field. To delete multiple characters or type a password, the user was forced to navigate from the input field back down to the keyboard on every single keystroke.
2. When views or component trees unmounted (or during React Strict Mode DEV double-mount cycles), synchronous unregistration of the active focused node triggered immediate fallback focus selection on sibling nodes that were themselves in the process of unmounting, creating a rapid focus hopping cascade and settling on arbitrary elements.

## Symptoms
- Pressing Enter on virtual keyboard character or Backspace keys reset active focus to `#tv-node-signin-field-email`.
- Rapidly unmounting components caused focus flickering or landing on unintentional elements.
- Strict Mode initial mount caused focus to jump between nodes.

## What Didn't Work
- Calling `e.stopPropagation()` in keyboard Enter key handlers: the event bubbled properly, but the node itself was unregistering and re-registering due to re-renders.
- Inspecting `autoFocus` props inside components: even with `autoFocus` guards, whenever a parent component re-rendered with new inline arrow functions (`onEnter={() => ...}`), the `<Focusable />` hook saw prop mutations and re-registered the node with `SpatialNavigationContext`, prompting fallback re-focusing.

## Solution
1. **Stabilize Mutable Props in `Focusable.tsx` with Ref Cache (`propsRef`):**
   Instead of re-registering nodes or triggering effects whenever callbacks (`onEnter`, `onFocus`, `onBlur`) or navigation directions change, store mutable properties inside a stable `useRef`:
   ```typescript
   const propsRef = useRef({ onEnter, onFocus, onBlur, up, down, left, right });
   useEffect(() => {
     propsRef.current = { onEnter, onFocus, onBlur, up, down, left, right };
   });
   ```
   Node registration only executes once on mount (or when `focusId` or `group` genuinely changes), eliminating unregistration/re-registration thrashing when typing updates parent state.

2. **Debounced Fallback Re-anchoring in `SpatialNavigationContext.tsx`:**
   When an active node unmounts, defer fallback focus selection to a zero-timeout tick (`setTimeout(..., 0)`) rather than synchronously picking a sibling node while unmount batches are still running:
   ```typescript
   if (focusedIdRef.current === id) {
     focusedIdRef.current = null;
     setFocusedId(null);
     setTimeout(() => {
       if (!focusedIdRef.current) {
         // Select stable fallback from remaining mounted nodes
         selectDefaultFocus();
       }
     }, 0);
   }
   ```
   This allows React Strict Mode mount-unmount-remount storms and multi-component route transitions to completely settle before evaluating which element should receive focus.

## Why This Works
1. Storing mutable function references in `propsRef` decouples component re-renders from node lifecycle registration in the spatial navigation registry. The virtual keyboard key remains continuously registered and retains focus across state mutations.
2. Debouncing unmount re-anchoring gives the React fiber tree time to complete unmounting dying nodes and mounting incoming nodes before resolving the next focus anchor.

## Prevention
- Never re-register spatial navigation nodes on callback or prop reference changes. Use `propsRef` for dynamic callbacks and direction overrides.
- Never run synchronous fallback focus election during node unregistration. Always debounce fallback selection so unmount batches settle.
- Write automated Playwright E2E tests for continuous typing and backspace sequences (`e2e/login-navigation.spec.ts`).

## Related Issues
- `docs/solutions/spatial-navigation/10-foot-hierarchical-row-and-shelf-navigation.md`
- `docs/solutions/spatial-navigation/tv-spatial-scroll-performance-and-gpu-acceleration.md`
