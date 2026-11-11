---
name: tv-ui-ux-advisor
description: >-
  UI and UX advisor for analyzing TV frontend code changes, view templates, CSS stylesheets,
  and interaction designs against Sonzra Tizen's UI and UX guidelines (docs/guidelines/ui_ux.md,
  docs/BRAND.md, and docs/CONTEXT.md). Use this skill whenever reviewing interface changes,
  validating 10-foot legibility, checking radiant focus rings, verifying overscan margins,
  ensuring persistent player continuity, and auditing spatial D-pad ergonomics.
---

# Sonzra TV UI & UX Advisor (`tv-ui-ux-advisor`)

The TV UI & UX Advisor evaluates frontend code changes, layout geometry, focus aesthetics, and remote control interactions against Sonzra Tizen's official UI and UX guidelines.

## Reference Documents

- [UI & UX Guidelines](file:///root/Projects/sonzra-tizen/docs/guidelines/ui_ux.md)
- [Design System Specifications](file:///root/Projects/sonzra-tizen/docs/guidelines/design_system.md)
- [Brand System](file:///root/Projects/sonzra-tizen/docs/BRAND.md)
- [Context & Vision](file:///root/Projects/sonzra-tizen/docs/CONTEXT.md)

## Core UI/UX Invariants to Verify

### 1. 10-Foot Distance Legibility & Contrast
- **Quiet Audiophile Living Room Aesthetic:** Pure OLED dark canvas (`#09090F`, `#131319`) with high-contrast text (`#E2E1E6`) and radiant cyan / neon purple accents.
- **Font Scale:** No primary text smaller than `14px`; section titles $\ge 24\text{px}$; hero titles $\ge 38\text{px}$.
- **Tabular Numerics:** All track timers, durations, bitrates, and sample rates must use monospace tabular numbers (`font-mono`).

### 2. The Radiant Focus Halo
- **Unmistakable Focus Indication:** Exactly one focused element on screen at all times.
- **Visual Styling:** Every focused element must feature:
  - Cyan focus ring: `ring-2 ring-secondary` (`#43D7C6`).
  - Outer glow shadow: `shadow-[0_0_24px_rgba(73,220,202,0.55)]`.
  - Gentle physical lift: `scale-[1.03]` or `scale-105`.
  - Snappy 90ms animation curve: `transition: transform 0.09s ease-out, box-shadow 0.09s ease-out`.
  - GPU hardware acceleration: `will-change: transform; transform: translateZ(0)` on `.tv-focusable`.
- **Zero Nested Transitions:** Child elements inside cards must not define their own `transition-all` or duplicate `scale-[1.03]` transforms.
- **Zero Browser Default Chrome:** No default white or un-themed focus outlines.

### 3. Remote Control Ergonomics & Rail Flow
- **No Dead Ends:** From any interactive component, pressing D-pad arrows must move naturally to neighboring cards or rows.
- **Left Barrier Escape:** Pressing Left on the leftmost item of any content row must escape to the persistent Sidebar rail.
- **Dock Return Flow:** Pressing Up from the bottom player dock must return to the active shelf, never jumping to the hero.
- **Keyboard Focus Retention:** Virtual keyboard character, space, and backspace keys must retain focus when pressed; typing must never bounce focus back to the text input field.
- **High-Contrast Error Feedback:** Form validation and network errors must display an immediate high-contrast banner with an icon above action buttons without breaking spatial navigation.

### 4. Viewport Auto-Centering & Overscan Clearance
- **Boundary-Guarded Scrolling:** Only scroll elements if they fall outside safe vertical overscan margins (`rect.top < 80 || rect.bottom > viewHeight - 130`). Horizontal shelf navigation must bypass vertical scrolling entirely.
- **No Conflicting Smooth Scroll:** Never apply `scroll-smooth` to the main scroll container (`#tv-main-scroll-container`).
- **Bottom Clearance:** The main scroll container must enforce bottom padding (`pb-44`, `scrollPaddingBottom: 140px`) so content never hides behind the fixed 96px bottom player dock.
- **Overscan Margins:** Edge chrome must observe minimum 40px safe-area margins.

## Review Workflow

1. **Inspect Frontend Code Changes**:
   ```bash
   git diff main...HEAD -- 'src/views' 'src/components' 'src/index.css'
   ```
2. **Audit Against Invariants**: Run through the checklist above.
3. **Run Automated Test Suite**:
   ```bash
   npm test
   ```
4. **Deliver Structured Review**:
   - **Verdict**: `APPROVED`, `APPROVED WITH SUGGESTIONS`, or `CHANGES REQUESTED`
   - **Checklist**: Mark compliance across all UI/UX categories
   - **Findings**: Detail any spatial, contrast, or ergonomic flaws with file and line references
   - **Recommendations**: Provide concrete code snippets demonstrating the fix
