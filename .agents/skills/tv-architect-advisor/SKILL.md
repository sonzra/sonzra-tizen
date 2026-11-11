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

### 2. Decoupled Server Client Boundary
- **REST/JSON API Boundary:** The TV client must communicate with the Sonzra server via clean API services (`src/services/apiClient.ts`). No backend business logic or media server transcoding code belongs on the TV client.
- **Immutable DTOs:** Music domain models (`Album`, `Track`, `Artist`) must remain clean, serializable TypeScript interfaces.

### 3. Tizen TV Platform & Hardware Runtime Invariants
- **Hardware Key Registrations:** All remote keys (D-pad arrows, Enter, Return/Back, MediaPlay, MediaPause, MediaPlayPause, Next, Prev) must be registered on startup.
- **Defensive Browser Checks:** Calls to `window.tizen` or `window.webapis` must guard against undefined environments to ensure headless test execution in Vitest.
- **Audio Session Persistence:** The audio pipeline and player state must remain continuous across view transitions.

### 4. Automated Testing & Quality Standards
- **Spatial Matrix Coverage:** Any change introducing new focusable components, shelves, or views must include unit tests in `src/navigation/__tests__/spatialMath.test.ts`.
- **Quality Gate:** Code changes must pass `bin/quality` (`npm run build` + `npm test`).

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
