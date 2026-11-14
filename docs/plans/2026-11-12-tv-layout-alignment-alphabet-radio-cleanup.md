# Technical Implementation Plan: TV Layout Alignment, Alphabet Rail, Radio Option & Screen Decluttering

**Branch:** `feat/tv-layout-alignment-alphabet-radio-cleanup`  
**Worktree:** `/root/Projects/sonzra-tizen/.worktrees/feat-tv-layout-alignment-alphabet-radio-cleanup`  
**Date:** 2026-11-12  
**Advisors:** `tv-architect-advisor`, `tv-ui-ux-advisor`

---

## 1. Objectives & Requirements

Address 4 user-reported layout and feature requirements based on the canonical `sonzra` server/web implementation:
1. **Consistent Cover Presentation:** All covers must look the same across albums, artists, or any other list. Inspect `sonzra` to align conceptually: unified square aspect ratio (`aspect-square`), consistent rounded corners (`rounded-xl` / `rounded-2xl`), matching card structure, avoiding circular distortion for artists.
2. **Alphabet Navigation Sidebar:** Implement alphabet navigation on the right of the screen (A-Z, #) matching `sonzra`'s concept, adapted for TV remote D-pad spatial navigation with direct letter jump and zero focus traps.
3. **Radio Feature:** Implement the Radio feature in the TV app (critical for v1), supporting track/artist radio, auto-extending queue via `/server_connections/:server_connection_id/radio_tracks/:item_id`, and dedicated Radio toggles in player controls (Dock & Now Playing) plus "Start Radio" in Album Detail.
4. **Remove "Trash" / Gimmick Information:** Purge artificial, distracting sci-fi telemetry and mock text that doesn't exist in the core `sonzra` app (e.g. "TIZEN AUDIOPHILE CORE v4.2", "BIT-PERFECT DAC ACTIVE", fake 3D vinyl record mockups spinning out with concentric SVG rings, "SIDE A · 96kHz", "LP-2024", "Stereo PCM Direct", "Master MQA"). Keep only real metadata from Sonzra (`name`, `artist`, `year`, `tracks`, `artwork_url`, `duration`, `codec`/fidelity).

---

## 2. Architectural Design & Invariants

### Spatial Navigation Hierarchy & Boundaries
- **Alphabet Rail (`<AlphabetRail />`):**
  - Semantic group: `alphabet-rail`.
  - Focus IDs: `alpha-letter-A` .. `alpha-letter-Z`, `alpha-letter-#`.
  - **Left Barrier Escape:** Pressing `Left` from any letter in `alphabet-rail` jumps back to the media grid at the first card starting with that letter (or nearest card).
  - **Right Barrier:** Pressing `Right` from `alphabet-rail` stops cleanly at the edge (no trap).
  - **Grid to Rail:** Pressing `Right` on the rightmost column in `library-grid` or `artists-grid` jumps into `alphabet-rail` at the matching letter.
  - **Smooth Jump:** Pressing `Enter` or focusing a letter scrolls the main container to that letter's section.
- **Radio System Integration:**
  - `PlayerContext`: add `radioEnabled: boolean`, `toggleRadio()`, `startRadio(item)`, and auto-extension logic when queue has $\le 2$ items remaining.
  - API: `fetchRadioTracks(itemId, limit)` in `SonzraApiClient`.
  - Controls: `dock-btn-radio` in `BottomDock`, `np-ctrl-radio` in `NowPlayingView`, `album-btn-radio` in `AlbumDetailView`.
- **Card Consistency:**
  - `ArtistsView`: Replace circular avatar (`w-36 h-36 rounded-full`) with square card geometry (`aspect-square w-full rounded-xl`) matching `LibraryView`.
- **Decluttering:**
  - Remove all mock telemetry, fake SVG vinyl discs, and non-existent audiophile jargon across `HomeView`, `AlbumDetailView`, `NowPlayingView`, and `BottomDock`.

---

## 3. Step-by-Step Implementation Steps

### Step 1: Remove "Trash" Information & Declutter Views
- `HomeView.tsx`:
  - Remove top telemetry banner ("TIZEN AUDIOPHILE CORE v4.2", "BIT-PERFECT DAC", fake "IN PROGRESS" status).
  - Remove 3D vinyl disc sliding out with SVG concentric rings.
  - Remove fake 68% progress bar when no track is actively playing.
  - Present clean album jacket and authentic metadata.
- `AlbumDetailView.tsx`:
  - Remove 3D vinyl disc mockup and concentric rings SVG.
  - Remove fake badges ("Ultra Studio", "LP-2024", "Mastered for Spatial Audio").
  - Present clean album sleeve and real metadata.
- `NowPlayingView.tsx`:
  - Remove 3D vinyl disc mockup and "SIDE A · 96kHz".
  - Remove fake audio fidelity badges ("Living Room Samsung Q90C", "eARC", "Master Audio", "Stereo PCM").
  - Keep real codec/bitrate from track metadata.
- `BottomDock.tsx`:
  - Clean up any fake static badges.

### Step 2: Unify Cover Presentation Across Views
- `ArtistsView.tsx`:
  - Update artist card layout to use square aspect ratio (`aspect-square w-full rounded-xl`) matching album cards.
  - Keep high-contrast artist title, album count subtitle, and radiant cyan focus halo.
- `HomeView.tsx`:
  - Ensure all shelves (Continue Listening, Recently Added) use consistent square card presentation.

### Step 3: Implement Alphabet Navigation Rail (`<AlphabetRail />`)
- Create `src/components/AlphabetRail.tsx`:
  - Render letters `A` to `Z` plus `#`.
  - Register with group `alphabet-rail`.
  - Spatial navigation: Up/Down through letters, Left returns to media grid, Right is a boundary barrier.
  - Callback to scroll to letter section on focus or select.
- Update `LibraryView.tsx` & `ArtistsView.tsx`:
  - Group items by first letter (A-Z, #).
  - Add section headers/anchors or card references.
  - Integrate `AlphabetRail` on the right side of the layout.
  - Wire grid rightmost card `onArrow((dir) => dir === 'right' ...)` to focus the active letter in `alphabet-rail`.

### Step 4: Implement Radio Option
- `src/services/sonzraApi.ts`:
  - Implement `fetchRadioTracks(itemId: string, limit = 12): Promise<Track[]>`.
  - Query `/server_connections/:server_connection_id/radio_tracks/:item_id?limit=${limit}`.
- `src/context/PlayerContext.tsx`:
  - Add `radioEnabled: boolean`, `toggleRadio: () => void`.
  - Add `startRadio: (seed: Track | Album) => Promise<void>`.
  - Queue auto-extension when `radioEnabled` is true and track approaches queue end.
- `src/components/BottomDock.tsx`:
  - Add `dock-btn-radio` button with radio icon and cyan active state.
- `src/views/NowPlayingView.tsx`:
  - Add `np-ctrl-radio` button to transport controls.
- `src/views/AlbumDetailView.tsx`:
  - Add `album-btn-radio` ("Start Radio") action button.

### Step 5: Verification & Automated Quality Gate
- Unit tests: Add `src/navigation/__tests__/alphabetRail.test.tsx` and `src/navigation/__tests__/radioFeature.test.tsx`.
- Run `npm run build` (typecheck & Vite build).
- Run `npm test` (Vitest unit and spatial navigation suites).
- Run `npm run test:e2e` (Playwright suites).
- Run `bin/quality`.
- Deploy to physical Samsung TV via `./deploy-tv.sh`.
