# Implementation Plan: Group A - Now Playing Ergonomics & OSD Feedback

- **Branch:** `feat/now-playing-ergonomics`
- **Target Issues:** 
  - [#26](https://github.com/sonzra/sonzra-tizen/issues/26) [Perf/UX]: Fix Up Next queue scroll lag and sluggish D-pad responsiveness in Now Playing view
  - [#27](https://github.com/sonzra/sonzra-tizen/issues/27) [Bug]: Lyrics view mode displays no lyrics despite lyrics existing on server
  - [#28](https://github.com/sonzra/sonzra-tizen/issues/28) [UI/UX]: Redesign Now Playing view container to blend into canvas & remove useless dummy visualizer
  - [#29](https://github.com/sonzra/sonzra-tizen/issues/29) [UX]: Add OSD feedback toast when tracks or albums are added to queue
- **Status:** In Progress
- **Quality Gate:** `bin/quality` (TypeScript build + Vitest unit/spatial navigation + Playwright E2E)

---

## 1. Architectural & UI/UX Advisory Consultation

### Architectural Invariants (`tv-architect-advisor`)
1. **Centralized Spatial Navigation State:** Spatial navigation transitions between transport controls (`now-playing-controls`), tabs (`now-playing-tabs`), queue (`now-playing-queue`), and lyrics (`now-playing-lyrics`) must respect clean directional boundaries without focus traps.
2. **Instant TV Scroll Positioning:** On ARM TV processors, `scrollIntoView({ behavior: 'smooth' })` triggers continuous reflow loops on rapid D-pad key repeats. Replace with instant positioning `{ block: 'nearest' }` (no `behavior: 'smooth'`).
3. **Decoupled API Client & Robust Parsing:** `sonzraApi.fetchLyrics()` must parse structured lines, plain text, and synchronized LRC formats (`[mm:ss.xx]`) defensively, returning clean immutable DTOs without throwing or breaking UI.
4. **Queue Item Memoization:** `NowPlayingView` re-renders on playback time updates (every 250ms). Queue track rows must be memoized via `React.memo` and stable callback references so playback ticks do not re-render the entire queue list.
5. **Zero Focus Theft on OSD Toasts:** The OSD toast component must remain passive (`pointer-events-none`, non-focusable), strictly outside the spatial navigation tree.

### 10-Foot Living Room UI/UX Standards (`tv-ui-ux-advisor`)
1. **Canvas Blending (OLED Dark Sanctuary):** Remove harsh card containment boxes and unnecessary borders. Let album art, metadata, controls, and queue/lyrics breathe directly on the `#09090F` canvas.
2. **Visualizer Removal:** Completely eliminate the mock static spectrum visualizer under the cover art. Repurpose vertical space to expand album sleeve artwork (from 310px to 360-400px) with subtle ambient cyan glow (`shadow-[0_0_80px_rgba(67,215,198,0.15)]`).
3. **Legible 10-Foot Typography for Lyrics:** Increase font size from 16px to $\ge 24\text{px}$ (`text-2xl` / `text-[26px]`) with high contrast `#E2E1E6` for inactive lines and radiant cyan `#43D7C6` with glow for active synchronized lines.
4. **Queue Aesthetics & GPU Compositing:** Strip expensive `backdrop-blur-*` filters and nested transitions from queue rows; use solid dark surface colors (`bg-surface-container/80` / `#131319`).
5. **OSD Toast Feedback:** Toast notifications for queue actions ("Added [N] tracks from \"[Album]\" to queue" or "Added \"[Track]\" to queue") with 10-foot styling (dark glass `#131319`, high contrast white text, cyan icon accent `#43D7C6`), auto-dismissing after 2.8 seconds, positioned safely within overscan margins ($\ge 80\text{px}$ from screen edges).

---

## 2. Proposed Changes & Implementation Breakdown

### Unit 1: Now Playing Screen Redesign & Visualizer Removal (#28)
- **Target File:** `src/views/NowPlayingView.tsx`
- **Actions:**
  - Remove dummy spectrum visualizer (lines ~205-218).
  - Enlarge album artwork container (`w-[340px] h-[340px] xl:w-[400px] xl:h-[400px]`) with glowing ambient shadow `shadow-[0_0_80px_rgba(67,215,198,0.15)]`.
  - Strip outer rectangular containment and heavy border styling from the right panel (`data-testid="now-playing-right-panel"`), replacing heavy `backdrop-blur-3xl` with clean dark surface styling that blends seamlessly into the `#09090F` canvas.

### Unit 2: Up Next Queue Performance & Responsiveness (#26)
- **Target File:** `src/views/NowPlayingView.tsx`
- **Actions:**
  - Extract and memoize `NowPlayingQueueItem` with `React.memo` and shallow prop comparison (`track`, `isCurrent`, `onSelect`).
  - In `onFocus`, replace `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` with `scrollIntoView({ block: 'nearest' })`.
  - Remove `backdrop-blur-*` and nested scaling animations from queue rows; rely on `.tv-focusable` GPU-accelerated styling with snappy 90ms response.

### Unit 3: Lyrics Fetching, Parsing & 10-Foot Typography (#27)
- **Target Files:** `src/services/sonzraApi.ts`, `src/context/PlayerContext.tsx`, `src/views/NowPlayingView.tsx`
- **Actions:**
  - In `sonzraApi.ts`:
    - Enhance `fetchLyrics(itemId)` to handle:
      1. Structured JSON with `lines` (objects `{ text, start }` or strings).
      2. Plain text string in `lyrics`, `text`, or raw response.
      3. LRC timestamped format `[mm:ss.xx]`.
    - Provide fallback parsing helper `parseLyricsContent(raw)`.
  - In `PlayerContext.tsx`:
    - Ensure `loadLyrics(trackId)` caches results by `trackId` in `lyricsCacheRef`.
    - Ensure lyrics fetch is triggered on track change and exposed for manual tab switch trigger.
  - In `NowPlayingView.tsx`:
    - Upgrade lyric line typography: minimum `text-2xl` ($\ge 24\text{px}$), high contrast `#E2E1E6`.
    - Active lyric line: `text-secondary font-bold text-2xl drop-shadow-[0_0_12px_rgba(73,220,202,0.6)]`.
    - Replace smooth auto-scrolling with instant boundary-guarded scroll (`block: 'nearest'`).
    - Standardize empty state text to "No lyrics available for this track".

### Unit 4: Media OSD Queue Feedback Toast (#29)
- **Target Files:** `src/context/PlayerContext.tsx`, `src/components/MediaOsdToast.tsx`, `src/views/AlbumDetailView.tsx`, `src/views/HomeView.tsx`
- **Actions:**
  - In `PlayerContext.tsx`:
    - Add `toastMessage`: `{ id: number; label: string; title: string; subtitle?: string; icon: string; duration?: number } | null`.
    - Update `addToQueue(trackOrTracks, options?: { albumTitle?: string })`:
      - For single track: `Added "${track.title}" to queue`.
      - For multiple tracks: `Added ${tracks.length} tracks from "${options?.albumTitle || tracks[0]?.album || 'Album'}" to queue`.
      - Dispatch toast notification with 2800ms duration.
  - In `MediaOsdToast.tsx`:
    - Subscribe to `toastMessage` from `usePlayer()` alongside remote media control actions.
    - Render queue feedback with ListPlus/Check icon, cyan accent `#43D7C6`, and safe overscan margins (`top-20 right-20`, safe 80px inset).
    - Ensure automatic dismissal after 2.8s without stealing focus.
  - In `AlbumDetailView.tsx` and `HomeView.tsx`:
    - Pass album title in `addToQueue(tracks, { albumTitle: album.title })` for detailed toast copy.

---

## 3. Verification Plan & Test Matrix

1. **Unit & View Tests:**
   - `src/views/__tests__/NowPlayingLyrics.test.tsx`:
     - Test queue rendering without smooth scroll (`block: 'nearest'`).
     - Test lyrics rendering with $\ge 24\text{px}$ typography and LRC/plain parsing.
     - Test visualizer absence in DOM.
   - `src/components/__tests__/MediaOsdToast.test.tsx`:
     - Test toast appearance on queue additions with correct album/track copy.
     - Test auto-dismissal after 2.8s.
   - `src/services/__tests__/sonzraApi.test.ts`:
     - Test LRC and plain text lyrics parsing.
2. **Spatial Navigation Tests:**
   - `src/navigation/__tests__/nowPlayingQueue.test.ts`:
     - Test D-pad transitions between transport controls, scrub bar, tabs, and queue items.
3. **Automated Quality Gate:**
   - Run `npm test` -> all suites pass.
   - Run `npm run build` -> 0 TypeScript compiler warnings or errors.
   - Run `bin/quality` -> full gate passing with exit code 0.
