# Sonzra Tizen TV: User Interaction Flows & Specification

This document defines the core end-to-end user flows for the Sonzra Samsung Smart TV (Tizen 9.0) client. Each flow specifies the exact screen layout, spatial navigation hierarchy, remote key behaviors, state transitions, and real server API contracts.

---

## Architecture & Navigation Principles

1. **10-Foot Focus Invariant:** Exactly one interactive element owns the radiant cyan focus halo (`ring-2 ring-[#43D7C6] shadow-[0_0_24px_rgba(73,220,202,0.55)] scale-[1.03]`) at all times. Focus is never ambiguous, hidden, or disconnected.
2. **Left Escape Invariant:** Pressing **Left** from the leftmost element of any content row (`hero-resume`, column 0 of any shelf, tab 0, or `dock-track-info`) transitions directly into the `<Sidebar />` rail.
3. **Vertical Hierarchy Invariant:** Pressing **Down** advances strictly in order:
   $$\text{Hero} \longrightarrow \text{Shelf 1 (Continue)} \longrightarrow \text{Shelf 2 (Vault)} \longrightarrow \text{Bottom Player Dock}$$
4. **Group Memory Invariant:** Pressing **Up** from `<BottomDock />` restores focus to the last-focused content element, never jumping blindly across the screen to the hero.
5. **Real Server Boundary:** When authenticated, the TV client communicates with the real Sonzra server (default: `http://192.168.31.139:3000`) via structured JSON endpoints with Bearer tokens. Audio streams and album art resolve to `/server_connections/:id/audio/:item_id` and `/server_connections/:id/artwork/:item_id`.
6. **TV GPU Acceleration & Boundary-Guarded Centering:** Focus transitions run on a 90ms curve (`0.09s ease-out`) backed by `transform: translateZ(0)` and `will-change: transform`. Vertical `scrollIntoView` is strictly boundary-guarded (`rect.top >= 80 && rect.bottom <= viewHeight - 130`); horizontal shelf moves never trigger redundant vertical scroll recalculations.
7. **Virtual Keyboard Focus Continuity:** Keyboard keys retain active focus across keystrokes via callback stabilization (`propsRef`), preventing re-render focus stealing.

---

## Flow 1: Sign-In & Authentication Flow (TV Remote Entry)

The application entry point when no valid cached session exists.

```
┌────────────────────────────────────────────────────────────────────────┐
│  SONZRA AUDIO - 10-FOOT LIVING ROOM EDITION                            │
│                                                                        │
│  [Host: 192.168.31.139:3000]                                           │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ [Email Address]       │  │ (Q) (W) (E) (R) (T) (Y) (U) (I) (O) (P)│ │
│  │ demo@sonzra.com       │  │ (A) (S) (D) (F) (G) (H) (J) (K) (L)    │ │
│  ├───────────────────────┤  │ (Z) (X) (C) (V) (B) (N) (M) (.) (@)    │ │
│  │ [Password]            │  │ [123] [SPACE] [BACKSPACE] [CLEAR]     │ │
│  │ ••••••••              │  └────────────────────────────────────────┘ │
│  ├───────────────────────┤                                             │
│  │ [ SIGN IN TO SONZRA ] │                                             │
│  └───────────────────────┘                                             │
│  [ Explore Standalone Demo Mode ]                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Pre-conditions
- App launched on Tizen TV or browser.
- No cached token or expired token in `localStorage`.

### Screen & Initial Focus
- Screen: `<SignInView />`.
- **Initial Focus:** `signin-field-email` (immediate radiant cyan halo).

### Interaction & Key Mapping
1. **Selecting Active Field:**
   - D-pad **Down** from `signin-field-email` $\to$ `signin-field-password`.
   - D-pad **Down** from `signin-field-password` $\to$ `signin-btn-submit` ("Sign In to Sonzra").
   - D-pad **Down** from `signin-btn-submit` $\to$ `signin-btn-demo` ("Explore Standalone Demo Mode").
   - D-pad **Down** from `signin-btn-demo` $\to$ `signin-toggle-server` ("Advanced Server Settings").
2. **Entering the TV Virtual Keyboard:**
   - D-pad **Right** from `signin-field-email` or `signin-field-password` $\to$ transitions directly into the on-screen virtual keyboard (targeting row 0, `key-q` or nearest key).
3. **Virtual Keyboard Navigation:**
   - D-pad **Arrows** (Up, Down, Left, Right) navigate across the 4 keyboard rows.
   - Pressing **Enter (OK)** on an alphanumeric key appends the character to the active field (`email`, `password`, or `serverUrl`). Focus remains firmly on the pressed key (no focus theft back to input fields).
   - Pressing **Enter** on `[BACKSPACE]` deletes the last character while keeping focus on the `[BACKSPACE]` key.
   - Pressing **Enter** on `[CLEAR]` empties the active field while retaining focus on `[CLEAR]`.
   - Pressing **Enter** on `[DONE]` or pressing D-pad **Left** from column 0 exits keyboard back to input fields.
4. **Submitting Authentication:**
   - Pressing **Enter** on `signin-btn-submit` initiates `POST /api/v1/session` with `{ email_address, password }`.
   - **Loading State:** Button displays pulsating "AUTHENTICATING..." spinner with disabled state.
   - **Success State:** Token and session ID cached in `localStorage` under `sonzra_tv_auth_session`. Application transitions to `<HomeView />` with initial focus set to `hero-resume`.
   - **Failure State:** High-contrast error message banner displayed above the form (`"Invalid email or password"` or `"Cannot connect to server. Check host and port."`). Focus remains accessible and can be moved directly to the fields to retry.
5. **Standalone Demo Shortcut:**
   - Pressing **Enter** on `signin-btn-demo` sets `isDemoMode = true` and immediately enters `<HomeView />` using offline audiophile mock data.

---

## Flow 2: Home Sanctuary & Audiophile Shelf Navigation Flow

The primary living room music hub showcasing the active/featured album hero, continue listening shelf, and high-res vault.

```
┌──────┬─────────────────────────────────────────────────────────────────┐
│ [B]  │  [TOP HEADER: LIVING ROOM • BIT-PERFECT DIRECT STREAM]          │
│      │                                                                 │
│ [H]* │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │ FEATURED HERO: Low Roar - "0"                              │ │
│ [L]  │  │ [ RESUME LISTENING ]*  [ ADD TO QUEUE ]                    │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│ [A]  │                                                                 │
│      │  CONTINUE LISTENING                                             │
│ [S]  │  [ Card 0 ]   [ Card 1 ]   [ Card 2 ]   [ Card 3 ]              │
│      │                                                                 │
│ [U]  │  HIGH-RES VAULT                                                 │
│      │  [ Card 0 ]   [ Card 1 ]   [ Card 2 ]   [ Card 3 ]              │
├──────┴─────────────────────────────────────────────────────────────────┤
│ [PERSISTENT MINI-PLAYER DOCK: Track Info | << | |> | >> | [Cinema] ]   │
└────────────────────────────────────────────────────────────────────────┘
```

### Pre-conditions
- User is authenticated or in demo mode.
- Real Sonzra server library loaded via `GET /api/v1/library/albums`.

### Screen & Initial Focus
- Screen: `<HomeView />`.
- **Initial Focus:** `hero-resume` (with radiant cyan halo).

### Interaction & Key Mapping
1. **Hero Actions:**
   - D-pad **Right** from `hero-resume` $\to$ `hero-queue`.
   - Pressing **Enter** on `hero-resume`: Starts immediate playback of featured album, updates `<BottomDock />`, and displays playback status.
2. **Descending the Shelf Hierarchy:**
   - D-pad **Down** from `hero-resume` or `hero-queue` $\to$ moves to `continue-shelf` (targeting the first visible card, `continue-0`).
   - D-pad **Left / Right** on `continue-shelf` $\to$ scrolls horizontally across album cards (`continue-0` $\leftrightarrow$ `continue-1` $\leftrightarrow$ `continue-2` ...).
   - D-pad **Down** from `continue-shelf` $\to$ advances down to `recent-shelf` (preserving horizontal column alignment).
   - D-pad **Down** from `recent-shelf` $\to$ enters the persistent `<BottomDock />` (targeting `dock-track-info` or `dock-play`).
3. **Ascending / Group Memory:**
   - D-pad **Up** from `<BottomDock />` $\to$ returns focus to the exact card previously focused in `recent-shelf` (Group Memory).
   - D-pad **Up** from `recent-shelf` $\to$ returns to `continue-shelf`.
   - D-pad **Up** from `continue-shelf` $\to$ returns to `hero-resume`.
4. **Left Escape to Sidebar:**
   - Pressing D-pad **Left** from `hero-resume`, `continue-0`, or `recent-0` $\to$ exits content and moves focus to `<Sidebar />` item `sidebar-home`.
5. **Card Action:**
   - Pressing **Enter** on any album card plays the album's first track or navigates to `<AlbumDetailView />`.

---

## Flow 3: Left Rail Sidebar & View Switching Flow

Fast global navigation across views without leaving the 10-foot comfort zone.

```
┌──────┬─────────────────────────────────────────────────────────────────┐
│ [B]  │  Brand Icon (Sonzra Mark)                                       │
│ [H]* │  Home View                                                      │
│ [L]  │  Library Vault (Albums / Genres)                                │
│ [A]  │  Artists Vault                                                  │
│ [S]  │  Settings & Server Config                                       │
│ [U]  │  User Profile                                                   │
└──────┴─────────────────────────────────────────────────────────────────┘
```

### Nodes in Sidebar
- `sidebar-brand` (top logo)
- `sidebar-home` (Home icon)
- `sidebar-library` (Library album icon)
- `sidebar-artists` (Artists icon)
- `sidebar-settings` (Gear icon)
- `sidebar-profile` (User avatar)

### Interaction & Key Mapping
1. **Vertical Rail Navigation:**
   - D-pad **Up / Down** navigates smoothly between sidebar icons with instant cyan halo and tooltip badge.
2. **Selecting a View:**
   - Pressing **Enter** on `sidebar-home` $\to$ switches to `<HomeView />`, moves focus to `hero-resume`.
   - Pressing **Enter** on `sidebar-library` $\to$ switches to `<LibraryView />`, moves focus to `tab-all`.
   - Pressing **Enter** on `sidebar-artists` $\to$ switches to `<ArtistsView />`, moves focus to `artist-card-0`.
   - Pressing **Enter** on `sidebar-settings` $\to$ switches to `<SettingsView />`, moves focus to `input-server-url`.
3. **Exiting Sidebar to Content:**
   - Pressing D-pad **Right** from any sidebar item transitions focus into the primary entry element of the current view (e.g. from `sidebar-home` to `hero-resume`, or from `sidebar-library` to `tab-all`).

---

## Flow 4: Library Catalog & High-Res Vault Flow

Browsing the complete music vault with category filters, album grid, and deep detail inspection.

```
┌────────────────────────────────────────────────────────────────────────┐
│  LIBRARY VAULT                                                         │
│  [ ALL ALBUMS ]*  [ HI-RES FLAC ]  [ FAVORITES ]  [ RECENTLY ADDED ]   │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Low Roar     │  │ Stryper      │  │ Pitty        │  │ Skillet     │ │
│  │ 0 (2014)     │  │ 7 Weeks      │  │ Admirável    │  │ Awake       │ │
│  │ [grid-0]*    │  │ [grid-1]     │  │ [grid-2]     │  │ [grid-3]    │ │
│  ├──────────────┼──┼──────────────┼──┼──────────────┼──┼─────────────┤ │
│  │ Charlie B.   │  │ Angra        │  │ Green Day    │  │ Resgate     │ │
│  │ Acústico MTV │  │ Aurora       │  │ American Id. │  │ Acústico    │ │
│  │ [grid-4]     │  │ [grid-5]     │  │ [grid-6]     │  │ [grid-7]    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Pre-conditions
- Authenticated user with library synchronized from real server `api/v1/library/albums`.

### Screen & Initial Focus
- Screen: `<LibraryView />`.
- **Initial Focus:** `tab-all` (First category tab).

### Interaction & Key Mapping
1. **Category Tabs:**
   - D-pad **Left / Right** navigates between category tabs (`tab-all`, `tab-flac`, `tab-favorites`, etc.).
   - Pressing **Enter** filters the grid.
2. **Entering Album Grid:**
   - D-pad **Down** from tabs moves into the grid row (`grid-0`).
   - D-pad **Left / Right / Up / Down** navigates spatially across the 4-column grid.
   - Scrolling viewport centers the focused card smoothly (`block: 'center'`).
3. **Left Escape:**
   - D-pad **Left** from any column 0 card (`grid-0`, `grid-4`, etc.) transitions to `<Sidebar />` item `sidebar-library`.
4. **Opening Album Details:**
   - Pressing **Enter** on any album card opens `<AlbumDetailView />`.
   - Focus initializes on `album-btn-play` ("Play Album").
   - D-pad **Down** navigates through tracklist (`track-0`, `track-1`, ...).
   - Pressing **Enter** on a track starts playback of that specific track.
5. **Back Navigation:**
   - Pressing **Return / Back (10009)** on remote returns from `<AlbumDetailView />` back to `<LibraryView />`, restoring focus to the previously selected album card.

---

## Flow 5: Persistent Audio Playback, Mini-Player Dock & Cinema Mode Flow

Continuous audiophile listening experience with zero interruption and fullscreen cinema visualization.

```
┌────────────────────────────────────────────────────────────────────────┐
│  PERSISTENT BOTTOM MINI-PLAYER DOCK                                    │
│  ┌────────────────────┐   ┌─────────┐   ┌───────────────────────────┐  │
│  │ [Art] Low Roar     │   │ |<  |>  │   │ 02:45 ========= 04:12     │  │
│  │       "I'll Keep   │   │   >|    │   │ 24-bit / 96kHz FLAC Direct│  │
│  │       Coming"      │   │         │   │ [Cinema Fullscreen] [CIN]*│  │
│  └────────────────────┘   └─────────┘   └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Pre-conditions
- Audio stream active from Sonzra server (`/server_connections/:id/audio/:item_id`).

### Screen & Initial Focus
- Screen: Persistent `<BottomDock />` docked at bottom 96px across all main views.

### Interaction & Key Mapping
1. **Entering the Bottom Dock:**
   - Pressing D-pad **Down** from the lowest visible shelf item moves focus into `<BottomDock />`.
   - Elements in Dock: `dock-track-info` $\leftrightarrow$ `dock-prev` $\leftrightarrow$ `dock-play` $\leftrightarrow$ `dock-next` $\leftrightarrow$ `dock-fullscreen`.
2. **Hardware TV Remote Media Buttons (Ambient Anywhere):**
   - Pressing `MediaPlay` (415) $\to$ Resumes playback, triggers `MediaOsdToast` ("PLAYING").
   - Pressing `MediaPause` (19) $\to$ Pauses audio, triggers `MediaOsdToast` ("PAUSED").
   - Pressing `MediaPlayPause` (10252) $\to$ Toggles play/pause state.
   - Pressing `MediaNext` / `FastForward` (417) $\to$ Advances to next track.
   - Pressing `MediaPrev` / `Rewind` (412) $\to$ Restarts track or plays previous track.
3. **Cinema Mode (`NowPlayingView`):**
   - Pressing **Enter** on `dock-fullscreen` or `dock-track-info` transitions into `<NowPlayingView />`.
   - Screen displays full 1080p/4K album artwork, high-resolution waveform/equalizer bars, large typography, bit-perfect streaming metadata badge, and the playback queue.
   - Pressing **Return / Back (10009)** exits cinema mode back to previous view; audio playback continues seamlessly with zero interruption.

---

## Flow 6: Settings, Server Configuration & Sign-Out Flow

Managing audio engine parameters, server connections, and session revocation.

```
┌────────────────────────────────────────────────────────────────────────┐
│  SETTINGS & HARDWARE CONFIGURATION                                     │
│                                                                        │
│  [ Server URL: http://192.168.31.139:3000 ]                            │
│  [ Active Session: demo@sonzra.com (User #1) ]                         │
│                                                                        │
│  AUDIO STREAMING                                                       │
│  (•) Bit-Perfect FLAC Direct Stream   ( ) Resampled PCM (48kHz)        │
│                                                                        │
│  BUFFER CAPACITY                                                       │
│  [ 64 MB Audio Buffer ]                                                │
│                                                                        │
│  ACCOUNT & SESSION                                                     │
│  ┌────────────────────────┐                                            │
│  │ [ SIGN OUT OF SONZRA ] │                                            │
│  └────────────────────────┘                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Pre-conditions
- Navigated via `sidebar-settings`.

### Screen & Initial Focus
- Screen: `<SettingsView />`.
- **Initial Focus:** `settings-input-server` or `settings-btn-test-conn`.

### Interaction & Key Mapping
1. **Testing Connection:**
   - Pressing **Enter** on "Test Connection" executes `GET http://192.168.31.139:3000/up`.
   - Displays real-time round-trip latency (`"Connected to Sonzra Server (12ms)"`).
2. **Sign-Out Action:**
   - D-pad **Down** to `settings-btn-signout` ("Sign Out of Sonzra").
   - Pressing **Enter** executes `DELETE /api/v1/session` with `Bearer <token>`.
   - Clears `sonzra_tv_auth_session` from `localStorage`.
   - Resets state in `AuthContext`.
   - Automatically unmounts `<MainLayout />` and mounts `<SignInView />`.
   - **Focus Reset:** Focus immediately anchors to `signin-field-email` on `<SignInView />` with radiant cyan halo.

---

## Test Verification Matrix for Flows

| Flow ID | Scenario | Remote Key Sequence | Expected Verification |
| :--- | :--- | :--- | :--- |
| **F1.1** | Boot to Sign-In | App Startup | Focus immediately on `signin-field-email`; cyan ring visible. |
| **F1.2** | TV Keyboard Input | Right, Right, Down, Enter | Character appended to email/password field; zero focus trap. |
| **F1.3** | Real Server Sign-In | Down to `signin-btn-submit`, Enter | Calls `POST /api/v1/session`, transitions to `HomeView`, focus on `hero-resume`. |
| **F1.4** | Standalone Demo Mode | Down to `signin-btn-demo`, Enter | Transitions to `HomeView` with mock data; focus on `hero-resume`. |
| **F2.1** | Shelf Traversal | Down, Down, Down | Moves: `hero-resume` $\to$ `continue-0` $\to$ `recent-0` $\to$ `dock-track-info`. |
| **F2.2** | Dock Up Escape | Up from Dock | Restores focus to `recent-0` (Group Memory invariant). |
| **F2.3** | Left Escape | Left from `continue-0` | Moves focus to `sidebar-home`. |
| **F3.1** | View Switch via Rail | Enter on `sidebar-library` | Opens `LibraryView`; focus on `tab-all`. |
| **F4.1** | Open Album Detail | Enter on `grid-0` | Opens `AlbumDetailView`; focus on `album-btn-play`. |
| **F4.2** | Return Back | Remote Return key (10009) | Returns to `LibraryView`; focus on `grid-0`. |
| **F5.1** | TV Media Play/Pause | Remote MediaPlay / MediaPause | Audio plays/pauses; `MediaOsdToast` appears top-right. |
| **F5.2** | Fullscreen Cinema Mode | Enter on `dock-fullscreen` | Opens `NowPlayingView`; Back key returns without audio drop. |
| **F6.1** | Sign-Out Flow | Enter on `settings-btn-signout` | Calls `DELETE /session`, unmounts views, lands on `signin-field-email`. |
