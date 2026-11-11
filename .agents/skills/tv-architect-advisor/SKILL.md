---
name: tv-architect-advisor
description: >-
  Architect advisor for analyzing code changes, PRs, and architectural proposals against
  Sonzra Tizen's architectural guidelines (docs/guidelines/architecture.md and docs/ENGINEERING.md).
  Use this skill whenever reviewing code, validating new designs, or verifying compliance
  with 10-foot spatial navigation invariants, group boundaries, decoupled API clients,
  Tizen hardware key bindings, and testing standards.
---

# Sonzra TV Architect Advisor (`tv-architect-advisor`)

The TV Architect Advisor evaluates code changes, proposed designs, and refactoring efforts against Sonzra Tizen's official architectural guidelines.

## Reference Documents

- [Architectural Guidelines](file:///root/Projects/sonzra-tizen/docs/guidelines/architecture.md)
- [UI & UX Guidelines](file:///root/Projects/sonzra-tizen/docs/guidelines/ui_ux.md)
- [Engineering Principles](file:///root/Projects/sonzra-tizen/docs/ENGINEERING.md)
- [Context & Vision](file:///root/Projects/sonzra-tizen/docs/CONTEXT.md)

## Core Architectural Invariants to Verify

### 1. 10-Foot Spatial Navigation Hierarchy
- **Zero Focus Traps:** Spatial transitions must strictly follow the defined shelf/row hierarchy. Moving Down from content elements must advance to the next shelf down, never skipping directly to the fixed bottom player dock.
- **Group Attribution:** Every focusable node must declare its semantic group attribute (`sidebar`, `bottom-dock`, `hero-actions`, `continue-shelf`, `recent-shelf`, `library-tabs`, `library-grid`, `album-actions`, `album-tracks`).
- **Sidebar Rail Flow:** Pressing Left on the leftmost element of any content row must escape into the Sidebar rail (`sidebar-home`, `sidebar-library`, etc.). Pressing Right from the Sidebar rail must cleanly enter the active view's primary content.
- **Callback Stabilization (`propsRef`):** Components wrapping `<Focusable />` must never cause node unregister/re-register cycles across state re-renders (such as keystroke typing or backspacing). Dynamic handlers must be cached via `propsRef`.
- **Debounced Unmount Re-anchoring:** Node unregistration must debounce fallback focus selection (`setTimeout(..., 0)`) so React Strict Mode cycles and batch unmounts settle safely.
- **Boundary-Guarded Centering:** Vertical `scrollIntoView` must be guarded by safe overscan margins (`rect.top >= 80 && rect.bottom <= viewHeight - 130`) so horizontal shelf transitions never cause vertical jitter. Never apply global CSS `scroll-smooth` to the main TV container.

### 2. Decoupled Server Client Boundary
- **REST/JSON API Boundary:** The TV client must communicate with the Sonzra server via clean API services (`src/services/apiClient.ts`). No backend business logic or media server transcoding code belongs on the TV client.
- **Immutable DTOs:** Music domain models (`Album`, `Track`, `Artist`) must remain clean, serializable TypeScript interfaces.

### 3. Tizen TV Platform & Hardware Runtime Invariants
- **Hardware Key Registrations:** All remote keys (D-pad arrows, Enter, Return/Back, MediaPlay, MediaPause, MediaPlayPause, Next, Prev) must be registered on startup.
- **Defensive Browser Checks:** Calls to `window.tizen` or `window.webapis` must guard against undefined environments to ensure headless test execution in Vitest.
- **Audio Session Persistence:** The audio pipeline and player state must remain continuous across view transitions.

### 4. Automated Testing & Quality Standards
- **Spatial Matrix Coverage:** Any change introducing new focusable components, shelves, or views must include unit tests in `src/navigation/__tests__/spatialMath.test.ts`.
- **Playwright E2E Coverage:** End-to-end user flows, login typing, keyboard retention, and view switching must be tested in `e2e/*.spec.ts`.
- **Quality Gate:** Code changes must pass `bin/quality` (`npm run build` + `npm test` + Playwright suites).

### 5. Cross-Project Parity Audit (sonzra-tizen <-> sonzra)
- **Sister Repository Impact:** Verify whether changes to audio playback, streaming, state scrobbling, or API usage require backend support or web player parity fixes in `sonzra/sonzra`.
- **Sister Issue Gate:** Ensure a structured GitHub issue has been filed on `sonzra/sonzra` using `gh issue create -R sonzra/sonzra` before signing off on architectural reviews that touch cross-cutting domains.

## Review Workflow

1. **Inspect Code Changes**:
   ```bash
   git diff main...HEAD
   ```
2. **Audit Against Invariants**: Run through the checklist above.
3. **Verify Quality Suite**:
   ```bash
   bin/quality
   ```
4. **Deliver Structured Review**:
   - **Verdict**: `APPROVED`, `APPROVED WITH SUGGESTIONS`, or `CHANGES REQUESTED`
   - **Checklist**: Mark compliance for each architectural dimension
   - **Findings**: Detail any anti-patterns with file and line references
   - **Recommendations**: Provide idiomatic code snippets demonstrating the fix
