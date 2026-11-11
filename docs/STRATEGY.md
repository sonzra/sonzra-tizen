# Sonzra Tizen TV: Product Strategy & Roadmap

## 1. Product Goals

1. **Top-Tier 10-Foot Living Room Audio Experience:** Deliver an interface so intuitive, beautiful, and tactile that users prefer playing music through their Smart TV and home audio system over mobile streaming.
2. **Seamless Sonzra Ecosystem Pairing:** Connect effortlessly to local or remote Sonzra servers via Quick Connect 6-character pairing codes or direct host URLs.
3. **Flawless Remote Control Usability:** Zero focus traps, instant response times, natural shelf-to-shelf navigation, and continuous playback.

---

## 2. Release Milestones

### Milestone 1: 10-Foot Navigation & Core Screens (Current)
* [x] Establish dark OLED design system with Tailwind CSS and glowing focus ring shaders.
* [x] Implement 4 core views:
  - `HomeView`: Hero album spotlight with vinyl sleeve animation, Continue Listening shelf, and Recently Added shelf.
  - `LibraryView`: 5-column widescreen card grid, category tabs, and sort selector.
  - `AlbumDetailView`: 12-column widescreen split, vinyl sleeve, and interactive tracklist table.
  - `NowPlayingView`: Tri-column cinema listening room, rotating LP, spectrum visualizer, and Up Next drawer.
* [x] Implement robust 10-foot hierarchical spatial navigation engine with row/shelf transitions and sidebar rail handoffs.
* [x] Samsung Certificate packaging (`Sonzra.wgt`) and automated SDB physical TV deployment.

### Milestone 2: Live Sonzra Server API & Auth Pairing
* [ ] Integrate live Rails API client (`/api/v1/library/albums`, `/api/v1/library/artists`).
* [ ] Implement Quick Connect pairing dialog on TV with numeric code display.
* [ ] Store persistent session token in `localStorage` / Tizen persistent storage.
* [ ] Real-time library search view with on-screen virtual keyboard support.

### Milestone 3: Audio Engine Hardening & Tizen AVPlay
* [ ] Native Tizen `AVPlay` hardware decoder integration for Gapless FLAC and high-bitrate DSD / ALAC playback.
* [ ] MediaSession API integration for TV ambient screensaver metadata.
* [ ] Playback reporting scrobbler (`/api/v1/playback_reports`) for cross-device resume synchronization.

### Milestone 4: Multi-Room & Living Room Polish
* [ ] Multi-zone speaker discovery and eARC / optical output status.
* [ ] Full-screen lyrics display with synchronous karaoke scroll.
* [ ] TV screensaver mode with ambient artwork transitions after 2 minutes of idle playback.
