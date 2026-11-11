# Sonzra Tizen TV: Design System & 10-Foot UI/UX Specifications

## 1. Design Principles

1. **Remote-First Spatial Navigation:** Every interactive element must be reachable via D-pad arrows (`up`, `down`, `left`, `right`) and activated by `Enter` / `OK`. No hover-exclusive states.
2. **10-Foot Distance Legibility:** Typography, contrast, and element sizing are calibrated for viewing distances between 8 and 12 feet on 55" to 85" TV panels.
3. **High Focus Contrast:** The currently focused element must stand out immediately with scale transformation, radiant cyan glowing halo ring, and crisp typography contrast.
4. **Persistent Playback Continuity:** The audio pipeline and mini-player dock remain persistent across all screens.

---

## 2. Component Design Specifications

### A. Focusable Elements (`<Focusable />`)
Every interactive element must wrap in `<Focusable focusId="..." group="...">`:
* **Default State:** Transparent or muted background, clean border (`border-white/[0.04]`).
* **Focused State (`isFocused`):**
  - Ring: `ring-2 ring-secondary` (`#43D7C6`).
  - Shadow: `shadow-[0_0_24px_rgba(73,220,202,0.5)]`.
  - Transform: `scale-[1.03]` (cards) or `scale-105` (buttons).
  - Background: elevated surface (`bg-surface-container-high`).
  - Text: `text-on-surface` or `text-secondary`.

### B. Persistent Sidebar Rail (`<Sidebar />`)
* **Position:** Fixed left rail, width `w-24` (96px), full viewport height.
* **Navigation Items:**
  - `sidebar-home` (Home)
  - `sidebar-library` (Library)
  - `sidebar-now-playing` (Now Playing)
  - `sidebar-search` (Search)
  - `sidebar-settings` (Settings)
* **Left/Right Behavior:**
  - `Right` from any sidebar icon transitions into the active view's primary content.
  - `Left` from any leftmost content card or action button jumps into the sidebar rail.

### C. Persistent Bottom Player Dock (`<BottomDock />`)
* **Position:** Fixed bottom bar, height `h-24` (96px), `left-24 right-0`.
* **Controls:** Track info card, shuffle, previous, play/pause hero button, next, repeat, mini scrub line, favorite heart, volume, cinema fullscreen button.
* **Vertical Transitions:**
  - `Down` from the lowest shelf on a page enters the Bottom Dock.
  - `Up` from any button in the Bottom Dock returns directly to the last-focused content shelf.
  - `Left` from `dock-track-info` transitions into the Sidebar rail.

### D. Horizontal Media Shelves
* **Layout:** 4 columns on large screens, with horizontal scrolling.
* **Cards:** Square artwork (`aspect-square`), high-contrast title, secondary artist, progress bar, audio format badge (`MQA`, `FLAC 96kHz / 24-bit`).
* **Focus Overlay:** Circular play/pause button overlay with glowing teal background on focus.

### E. 12-Column Split Album Detail
* **Left Column (5 cols):** Vinyl sleeve stage, 3D disc sliding out, album metadata, action pills (`Play Album`, `Shuffle`, `Queue`, `Favorite`).
* **Right Column (7 cols):** Full tracklist table with column headers (`#`, `Title & Artist`, `Fidelity`, `Time`), playing equalizer animation bars.

### F. Fullscreen Cinema Listening Room (`<NowPlayingView />`)
* **Atmospheric Glow:** Tri-radial ambient blur backdrops dynamic to playback state.
* **Left Column:** Rotating vinyl LP with concentric groove SVG pattern and record sleeve.
* **Center Column:** Real-time animated 24-bar audio spectrum visualizer, large track typography, timeline scrub bar, and transport controls.
* **Right Column:** "Up Next" queue drawer with upcoming tracks.
