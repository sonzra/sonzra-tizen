# Sonzra Tizen TV: Product Strategy & Roadmap

## 1. Product Goals

1. **Top-Tier 10-Foot Living Room Audio Experience:** Deliver an interface so intuitive, beautiful, and tactile that users prefer playing music through their Smart TV and home audio system over mobile streaming.
2. **Seamless Sonzra Ecosystem Pairing:** Connect effortlessly to local or remote Sonzra servers via Quick Connect 6-character pairing codes or direct host URLs.
3. **Flawless Remote Control Usability:** Zero focus traps, instant response times, natural shelf-to-shelf navigation, and continuous playback.

---

## 2. Release Milestones

### Milestone 1: 10-Foot Core Screens & UI Foundation (Completed)
* [x] Establish dark OLED design system with Tailwind CSS and glowing focus ring shaders.
* [x] Implement 4 core views:
  - `HomeView`: Hero album spotlight with vinyl sleeve animation, Continue Listening shelf, and Recently Added shelf.
  - `LibraryView`: 5-column widescreen card grid, category tabs, and sort selector.
  - `AlbumDetailView`: 12-column widescreen split, vinyl sleeve, and interactive tracklist table.
  - `NowPlayingView`: Tri-column cinema listening room, rotating LP, spectrum visualizer, and Up Next drawer.
* [x] Initial 10-foot spatial navigation engine with row/shelf transitions and sidebar rail handoffs.
* [x] Samsung Certificate packaging (`Sonzra.wgt`) and automated SDB physical TV deployment.

### Milestone 2: TV Remote Navigation Hardening & User Sign-In (Current Focus)
* [ ] **TV Remote Controller Arrows & Full Spatial Reachability:**
  - Audit and fix spatial navigation across all screens, views, drawers, overlays, and header bars.
  - Ensure 100% reachability with TV controller arrows (Up, Down, Left, Right) with zero dead-ends or focus traps.
  - Seamless navigation between persistent navigation rail, page content shelves, header actions, and the bottom player dock.
* [ ] **Physical TV Media Control Key Bindings:**
  - Full hardware registration and event handling for Samsung remote multimedia keys (`MediaPlay`, `MediaPause`, `MediaPlayPause`, `MediaTrackNext`, `MediaTrackPrevious`, `MediaStop`, `FastForward`, `Rewind`).
  - Background playback control responsive to media buttons regardless of which screen or element is currently focused.
* [ ] **User Authentication & First-Launch Sign-In Page:**
  - Mandatory Sign-In page as the application's initial landing view when no valid user session exists.
  - User-scoped APIs (`/api/v1/auth/sign_in`, `/api/v1/me`, user-scoped library and stream access).
  - Secure session token persistence in `localStorage` / Tizen persistent storage across TV power cycles.
* [ ] **TV On-Screen Virtual Keyboard for D-Pad Input:**
  - Integrated 10-foot on-screen virtual keyboard with D-pad navigation, Enter key selection, delete, space, and quick domain shortcuts (`@`, `.com`) for effortless email and password entry on TV remotes.
  - Support for Samsung Tizen IME / native virtual keyboard input events.

### Milestone 3: Live Sonzra Server API & Library Sync
* [ ] Integrate live Rails API client with user-scoped headers (`/api/v1/library/albums`, `/api/v1/library/artists`, `/api/v1/library/playlists`).
* [ ] Quick Connect pairing alternative (6-character pairing code display to link from mobile/web).
* [ ] Real-time library search view with TV keyboard integration.
* [ ] Playback reporting scrobbler (`/api/v1/playback_reports`) for cross-device resume synchronization.

### Milestone 4: Audio Engine Hardening & Tizen AVPlay
* [ ] Native Tizen `AVPlay` hardware decoder integration for Gapless FLAC and high-bitrate DSD / ALAC playback.
* [ ] MediaSession API integration for TV ambient screensaver metadata.

### Milestone 5: Multi-Room & Living Room Polish
* [ ] Multi-zone speaker discovery and eARC / optical output status.
* [ ] Full-screen lyrics display with synchronous karaoke scroll.
* [ ] TV screensaver mode with ambient artwork transitions after 2 minutes of idle playback.
