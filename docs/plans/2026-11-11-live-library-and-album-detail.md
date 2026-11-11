# Implementation Plan: Live Library Sync & Album Detail Navigation

## Context & Motivation
Following Milestone 2's remote controller navigation hardening and authentication flow, Milestone 3 focuses on connecting the 10-foot TV experience directly to the live Sonzra Rails server API (`/api/v1/library/albums` and `/api/v1/library/items/:id`).

Currently, when a user is signed in to a real server, `<LibraryView />` and `<AlbumDetailView />` have initial scaffold structures, but:
1. `AlbumDetailView` defaults to fallback mock data if an album is not found immediately, and track IDs / metadata mapping from the live server need robust normalization (`stream_url`, `audio_url`, `artwork_url`, `duration_seconds`).
2. Remote Return / Back key (`10009` / `Escape`) navigation must reliably pop navigation history and restore focus to the exact album card in `LibraryView` or `HomeView`.
3. Spatial navigation within `AlbumDetailView` (`album-actions` to `album-tracks`, and down to `<BottomDock />`) must have complete spatial math and unit/E2E test coverage.
4. Audio streaming from live `/server_connections/:id/audio/:track_id` endpoints must trigger seamlessly when activating "Play Album" or individual track rows.

---

## Architecture & Technical Decisions

### 1. Centralized Data Flow & Live Library Sync
- **`ServerContext`**: On successful sign-in or session restoration, `fetchAlbums()` queries `/api/v1/library/albums` using the Bearer token.
- **Normalization in `SonzraApiClient`**:
  - Resolve relative artwork URLs to full host URLs (`/server_connections/:id/artwork/:item_id`).
  - Extract tracks from `/api/v1/library/items/:id` with complete fields: `id`, `title`, `artist`, `album`, `trackNumber`, `duration`, `audioUrl`, `codec`, `bitrate`.
  - Ensure `audioUrl` and `stream_url` are properly prioritized and resolved.

### 2. Spatial Navigation Hierarchy in Album Detail View
```
┌────────────────────────────────────────────────────────────────────────┐
│  [TOP HEADER / BREADCRUMBS: Library > Low Roar - 0]                    │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ [Vinyl Album Sleeve]  │  │ #  Title & Artist      Fidelity   Time │ │
│  │ 0 (2014) - Low Roar   │  ├────────────────────────────────────────┤ │
│  │                       │  │ [1. Breathe In]*       FLAC 24/96 7:34 │ │
│  │ [ PLAY ALBUM ]*       │  │ [2. Easy Way Out]      FLAC 24/96 4:48 │ │
│  │ [>] [+][♥]            │  │ [3. Nobody Else]       FLAC 24/96 4:39 │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ [PERSISTENT MINI-PLAYER DOCK]                                          │
└────────────────────────────────────────────────────────────────────────┘
```
- **Initial Focus:** `album-btn-play` ("Play Album") receives initial radiant cyan focus halo.
- **Group Hierarchy:**
  - `album-actions`: `album-btn-play` $\leftrightarrow$ `album-btn-shuffle` $\leftrightarrow$ `album-btn-queue` $\leftrightarrow$ `album-btn-fav`.
  - **Down** from `album-actions` $\to$ transitions to tracklist table (`track-row-${firstTrackId}`).
  - **Right** from `album-actions` $\to$ transitions to tracklist table (`track-row-${alignedTrackId}`).
  - **Left** from `album-actions` or tracklist column 0 $\to$ transitions directly to `<Sidebar />` item `sidebar-library`.
  - **Down** from the last visible track row $\to$ transitions to `<BottomDock />` (`dock-play` or `dock-track-info`).
  - **Up** from `<BottomDock />` $\to$ Group Memory restores focus to the previously active track row.
- **Back Key Return Flow:**
  - Pressing remote **Return / Back (`10009` or `Escape`)** pops navigation history and returns to `<LibraryView />` (or `<HomeView />`), restoring focus to the origin album card (`library-album-${id}`).

### 3. UI/UX Standards & Distance Legibility
- Track row title: $\ge 16\text{px}$ font weight 600.
- Artist & album subtitle: $\ge 14\text{px}$ `text-on-surface-variant`.
- Track duration: tabular monospace (`font-mono`) $\ge 14\text{px}$.
- Snappy 90ms GPU-accelerated focus halo with `translateZ(0)` on all track rows and action buttons.
- Safe overscan padding (`pb-36`) so track rows never render underneath the fixed bottom player dock.

---

## Implementation Units

### Unit 1: Data Normalization & API Hardening (`sonzraApi.ts` & `ServerContext.tsx`)
- Enhance `fetchAlbum(albumId)` to handle real server item payload schemas, parsing track arrays, duration conversions, and stream URLs.
- Ensure `ServerContext` updates `albums` and notifies active views.

### Unit 2: AlbumDetailView Remote Navigation & Live Data Binding (`AlbumDetailView.tsx`)
- Bind `AlbumDetailView` directly to live server album data without prematurely forcing mock album fallback.
- Wrap all action buttons and tracklist rows in `<Focusable />` with stable `propsRef` and canonical 90ms GPU focus halos.
- Implement live track playback: pressing Enter on a track starts playback of that track through `playTrack()`, updating `<BottomDock />`.
- Implement full album playback: pressing Enter on `album-btn-play` queues and plays the entire album starting at track 1.

### Unit 3: Spatial Math Hardening (`spatialMath.ts`)
- Ensure bidirectional transitions between `album-actions` $\leftrightarrow$ `album-tracks` are deterministic.
- Ensure Down from the last track enters `<BottomDock />` and Up from `<BottomDock />` restores the focused track.
- Verify Left barrier escape from any row directly to `<Sidebar />`.

### Unit 4: History & Return/Back Navigation (`SpatialNavigationContext.tsx`)
- Verify that `openAlbum(albumId)` records the origin view and focused element (`history.push(...)`).
- Verify that hardware key `10009` (Return) calls `goBack()`, restoring focus to the exact album card.

### Unit 5: Unit & Spatial Navigation Testing (`src/navigation/__tests__/`)
- Add Vitest test suite `albumNavigation.test.ts` asserting directional transitions across all `album-actions`, `album-tracks`, sidebar escape, and bottom dock transitions.

### Unit 6: Automated End-to-End Testing (Playwright)
- Author `e2e/library-and-album-navigation.spec.ts` testing:
  1. Navigate from Sidebar to LibraryView (`sidebar-library` $\to$ `library-tab-albums`).
  2. Traverse category tabs and enter album grid.
  3. Select an album card with Enter $\to$ transitions to `AlbumDetailView`.
  4. Verify focus initializes on `album-btn-play`.
  5. Navigate Down into tracklist rows and verify 90ms focus halos.
  6. Press Enter on track 2 $\to$ verify playback starts and `<BottomDock />` updates.
  7. Press remote Return/Back key $\to$ verify navigation returns to `LibraryView` and restores focus on the album card.
  8. Zero focus trap round-trip.

---

## Verification Plan
1. `npm run build`: Zero TypeScript compilation errors.
2. `npm test`: All Vitest unit and spatial navigation suites pass.
3. `npm run test:e2e`: All Playwright E2E tests pass (existing 23 tests + new library/album suite).
4. `./bin/quality`: 100% green exit code 0.
5. Deploy to physical Samsung TV (`./deploy-tv.sh`) and verify live on screen.
