# Plan: Remove Mocks and Transition to 100% Real Sonzra Library

```yaml
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
plan_depth: standard
created_at: 2026-11-12
```

## Goal Capsule

- **Objective:** Completely eradicate mock data fallbacks and demo mode from the Sonzra Tizen Smart TV app, making all views, navigation, player states, telemetry, and metrics 100% powered by the live Sonzra media server library.
- **Means:** Purge `MOCK_ALBUMS`, `MOCK_ARTISTS`, and `MOCK_SERVER_STATS` from `sonzraApi.ts`, `HomeView.tsx`, `LibraryView.tsx`, `ArtistsView.tsx`, `AlbumDetailView.tsx`, `NowPlayingView.tsx`, and `BottomDock.tsx`. Transition `mockData.ts` into isolated test fixtures. Provide clean empty/idle states when no audio has been played or when the library is loading.
- **Primary Constraints:**
  - Zero regression in 10-foot spatial navigation hierarchy (zero focus traps, left barrier escape, group memory).
  - All automated quality gates (`bin/quality`: build, unit tests, Playwright E2E) must exit 0.
  - Hardware accelerated GPU focus halos (`translateZ(0)`) and continuous audio streaming.

---

## Product & Architecture Contract

### Requirements
1. **R1 - Pure API-Driven sonzraApi:** `SonzraApiClient` must never fall back to mock data. If a request fails, it throws or returns empty collections (`[]` or `null`).
2. **R2 - Live Library Views:**
   - `HomeView`: Hero section showcases the user's primary/latest real album. Shelves display real albums (`serverAlbums.slice(...)`).
   - `LibraryView`: Displays actual album grid and dynamic server telemetry (actual count of albums, artists, tracks, and connected host name).
   - `ArtistsView`: Displays actual server artists.
   - `AlbumDetailView`: Loads the requested album and real tracks directly from `/api/v1/library/items/:id`.
3. **R3 - Real Player Continuity & Idle States:**
   - `BottomDock`: Renders active track metadata and artwork from the persistent audio player. When no track has been played yet in the session, renders an idle state or safe overscan placeholder without creating focus traps.
   - `NowPlayingView`: If entered without an active track, displays an idle prompt ("No track currently playing. Browse your library to start listening.") with a focusable button to enter `LibraryView`.
4. **R4 - Elimination of Demo Mode:**
   - Remove "Explore Demo Mode (Offline)" from `SignInView.tsx`.
   - Remove "Standalone Demo Mode" switch from `SettingsView.tsx`.
   - Production bundle contains zero mock datasets.
5. **R5 - Test Stability:** Move needed mock fixtures into `src/**/__tests__/fixtures/mockData.ts` so Vitest suites and Playwright tests continue to execute deterministically without depending on external network access.

---

## Implementation Units

### U1. Purge Mocks from `sonzraApi.ts` & Isolate Test Fixtures
- **Files:**
  - `src/services/sonzraApi.ts`
  - `src/services/mockData.ts` -> move to `src/__tests__/fixtures/mockData.ts`
- **Details:**
  - Remove imports of `mockData.ts` from `src/services/sonzraApi.ts`.
  - Remove demo mode checks and mock fallbacks in `fetchAlbums`, `fetchAlbum`, `fetchArtists`, `fetchArtist`.
  - Update unit tests that import `mockData.ts` to reference the test fixture.

### U2. Update `HomeView` & `LibraryView` to Real Library Only
- **Files:**
  - `src/views/HomeView.tsx`
  - `src/views/LibraryView.tsx`
- **Details:**
  - `HomeView`: Remove `MOCK_ALBUMS`. When `serverAlbums.length > 0`, hero is `serverAlbums[0]`, shelves display real albums. When empty, show clean empty state.
  - `LibraryView`: Remove `MOCK_ALBUMS` and `MOCK_SERVER_STATS`. Display real `serverAlbums`, actual `albums.length`, `artists.length`, total track count, and host from `config.serverUrl`.

### U3. Update `ArtistsView` & `AlbumDetailView` to Real Library Only
- **Files:**
  - `src/views/ArtistsView.tsx`
  - `src/views/AlbumDetailView.tsx`
- **Details:**
  - `ArtistsView`: Remove `MOCK_ARTISTS`. Render real `serverArtists`.
  - `AlbumDetailView`: Remove `getMockAlbumById` and `MOCK_ALBUMS`. Fetch album via `apiClient.fetchAlbum(albumId)` with loading skeleton and not-found handling.

### U4. Update `BottomDock` & `NowPlayingView` for Real Playback Lifecycle
- **Files:**
  - `src/components/BottomDock.tsx`
  - `src/views/NowPlayingView.tsx`
- **Details:**
  - `BottomDock`: Remove `MOCK_ALBUMS[0]`. If `currentTrack` is null, show idle state ("No Track Playing • Browse Library") or hide dock cleanly.
  - `NowPlayingView`: Remove `MOCK_ALBUMS[0]`. When `currentTrack` is null, render idle 10-foot screen with "Browse Library" button.

### U5. Remove Demo Mode from `SignInView`, `SettingsView`, and Auth Types
- **Files:**
  - `src/views/SignInView.tsx`
  - `src/views/SettingsView.tsx`
  - `src/context/AuthContext.tsx`
- **Details:**
  - Remove demo mode toggle in `SettingsView.tsx` and demo button in `SignInView.tsx`.
  - Clean up `demoMode` references in `AuthContext.tsx`.

### U6. Verification & Hardware Deployment
- Run `npm run build` (zero type errors).
- Run `npm test` (Vitest suites).
- Run `npm run test:e2e` (Playwright suites).
- Run `bin/quality`.
- Deploy to Samsung TV (`TQ65QN80FAUXXC`).
