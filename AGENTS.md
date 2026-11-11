# Sonzra Tizen Agent Instructions

## Workspace Isolation Invariant
- **Git Worktree Isolation:** All multi-phase roadmap features, epics, and implementation sessions (`ce-brainstorm`, `ce-plan`, `ce-work`) must execute in an isolated git worktree under `.worktrees/<branch-name>` off `main`.
- If the current working directory is the repository root on `main`, immediately invoke `ce-worktree` or run `git worktree add -b <branch-name> .worktrees/<branch-name> origin/main` to establish the isolated worktree before modifying files, running tests, or authoring plans.
- Never write or make feature commits directly on the root `main` checkout.

---

## Technical Architecture & Invariants

### 1. 10-Foot Spatial Navigation Hierarchy
- Follow [docs/guidelines/architecture.md](docs/guidelines/architecture.md) and [docs/guidelines/ui_ux.md](docs/guidelines/ui_ux.md).
- **Zero Focus Traps:** Spatial transitions must strictly follow the defined shelf/row hierarchy. Moving Down from content elements must advance to the next shelf down, never skipping directly to the fixed bottom player dock.
- **Left Barrier Escape:** Pressing **Left** on the leftmost interactive element of any content row (`hero-resume`, Card 0 of any shelf, Tab 0, Column 0 of the library grid, or `dock-track-info`) must transition cleanly into the `<Sidebar />` rail.
- **Group Memory & Up Escape:** Leaving the bottom player dock (`<BottomDock />`) by pressing **Up** must restore focus to the last-focused content element or active shelf, never jumping blindly across the screen to the hero.
- **Viewport Auto-Centering:** The scroll container must use `block: 'center'` with explicit padding (`pb-44`, `scrollPaddingBottom: 140px`) to prevent focused cards from scrolling beneath the fixed dock.

### 2. Design System & 10-Foot Visual Standards
- Follow [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and [docs/BRAND.md](docs/BRAND.md).
- **OLED Dark Sanctuary:** Canvas is deep space black (`#09090F`, `#131319`). Typography is high-contrast warm white (`#E2E1E6`).
- **Radiant Focus Halo:** Every focused element must project the cyan focus halo (`ring-2 ring-[#43D7C6]`, `shadow-[0_0_24px_rgba(73,220,202,0.55)]`, `scale-[1.03]`). Focus must never be ambiguous or invisible.
- **Distance Legibility:** Primary text must be $\ge 14\text{px}$; shelf titles $\ge 24\text{px}$; hero titles $\ge 38\text{px}$. Tabular numerics (`font-mono`) on all timers.

### 3. Tizen Hardware & Runtime Isolation
- **Hardware Key Bindings:** Register all remote keys (D-pad arrows, Enter, Return/Back, MediaPlay, MediaPause, MediaPlayPause, Next, Prev) with `tizen.tvinputdevice.registerKey()` via `src/navigation/tizenKeys.ts`.
- **Defensive Browser Checks:** Guard all `window.tizen` and `window.webapis` calls so code executes cleanly in standard browsers and headless Vitest runs.
- **Persistent Playback Continuity:** The audio pipeline and mini-player dock remain persistent across view navigation.

### 4. Decoupled Hexagonal Server Boundary
- The TV client consumes JSON APIs and native audio streams from the Sonzra server. It contains no media server scraping, transcoding, or multi-tenant database logic.
- Domain models (`Album`, `Track`, `Artist`) must remain clean, immutable TypeScript contracts.

### 5. Documented Solutions
- Consult [docs/solutions/](docs/solutions/) for verified solutions to past spatial navigation traps and Samsung certificate packaging issues (organized by category with YAML frontmatter).

### 6. Quality Gate
- All changes must pass `bin/quality` (`npm run build` typecheck and asset build + `npm test` spatial navigation test suites).

---

## Compound Engineering Lifecycle & Custom Skill Integration Hooks
When executing Compound Engineering skills (`ce-brainstorm`, `ce-plan`, `ce-work`, `ce-code-review`), you must actively integrate Sonzra Tizen's specialized advisor and verification skills at each phase:

### 1. Planning Phase (`ce-brainstorm`, `ce-plan`)
- **Architectural Scoping:** Consult [`tv-architect-advisor`](.agents/skills/tv-architect-advisor/SKILL.md) to ensure component trees respect semantic group boundaries, state management remains decoupled, and navigation trees contain zero focus traps.
- **UI/UX Budgeting:** Consult [`tv-ui-ux-advisor`](.agents/skills/tv-ui-ux-advisor/SKILL.md) during scoping. Verify 10-foot legibility, glowing cyan focus indicators, overscan margins, and safe-area clearance above the player dock.
- Every plan unit modifying UI must define explicit directional navigation criteria (`up`, `down`, `left`, `right`).

### 2. Execution & TDD Phase (`ce-work`)
- **Developer Discipline:** Follow [`tv-developer`](.agents/skills/tv-developer/SKILL.md). Always write Vitest spatial navigation tests alongside new views and shelves in `src/navigation/__tests__/`.
- **Focusable Component Discipline:** Every interactive TV element must be wrapped in `<Focusable focusId="..." group="...">` with canonical focus rings.

### 3. Verification & Review Phase (`ce-work` quality check, `ce-code-review`)
- **Automated Quality Gate:** Run [`tv-verify-implementation`](.agents/skills/tv-verify-implementation/SKILL.md) to ensure zero TypeScript errors (`npm run build`), 100% test pass on Vitest suites, and exit 0 on `bin/quality`.
- **TV Packaging & Hardware Verification:** When testing hardware, execute `./deploy-tv.sh` to package, sign with the Samsung Certificate profile, and launch live on the physical TV screen.
- **Cross-Project Parity Verification:** Verify that any TV player fixes, API contract requirements, or feature parity needs have corresponding GitHub issues filed on `sonzra/sonzra`.

---

## Cross-Project Parity & Sister Repository Synchronization (sonzra-tizen <-> sonzra)
Sonzra operates as a multi-client ecosystem:
- **Core Server & Web App:** `sonzra/sonzra` (Rails 8 API, Hotwire, audio streaming, database, queue)
- **Smart TV Client:** `sonzra/sonzra-tizen` (React 19, TypeScript, 10-foot spatial navigation, Tizen OS)

### 1. Mandatory Cross-Project Parity Audit
Whenever developing, fixing bugs, or implementing features in `sonzra-tizen`, agents must audit whether the change has cross-cutting implications for the main `sonzra` server or web player:
- **Player & Audio Pipeline:** Buffering strategies, queue advancement logic, seek recovery, playback progress reporting, track duration precision.
- **Server API & Schemas:** New endpoint requirements, missing metadata fields, CORS or range request headers, auth token refresh upon 401s.
- **State Synchronization:** Playback scrobbling (`/api/v1/playback_reports`), favorite toggles, playlist modifications.
- **TV Discovery & Pairing:** Quick Connect PIN handshake, local network server discovery.

### 2. Automatic Sister Issue Creation Protocol
If a bugfix, design refinement, or feature in `sonzra-tizen` reveals a defect, backend API requirement, or parity gap in `sonzra`:
1. **Never leave it as unwritten memory.**
2. **Immediately file a GitHub issue on `sonzra/sonzra`** using the GitHub CLI:
   ```bash
   gh issue create -R sonzra/sonzra \
     --title "[Parity] <Brief descriptive title>" \
     --body "<Structured issue body>"
   ```
3. **Structured Issue Format:**
   ```markdown
   ## Cross-Project Parity: <Title>

   **Originating Project:** `sonzra-tizen`
   **Originating PR / Commit:** <Link or SHA>
   **Subsystem:** Player Engine / API Contract / State Sync / Networking

   ### Context & Discovery
   Briefly describe the TV bug discovered, API requirement identified, or capability implemented.

   ### Sister Project Impact & Parity Need
   Explain how this affects the main Sonzra server or web app (e.g. if the TV client requires a new query param on `/api/v1/library/albums` or discovered an audio stream range request glitch).

   ### Actionable Next Steps for Specialized Agents
   Provide concrete guidance, relevant controller/service file pointers, and expected acceptance criteria for the agent that will implement this issue.
   ```

### 3. Review Gate Requirement
During `ce-code-review` and `tv-verify-implementation`, the reviewer must verify that any identified sister-repo implications have a corresponding GitHub issue created on `sonzra/sonzra` before issuing a final approval receipt.
