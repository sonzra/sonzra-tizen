# Sonzra Tizen TV: Engineering Principles & Workflow

## 1. Tech Stack Overview

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | 19.x | Declarative UI components & state |
| **Language** | TypeScript | 5.8+ | Strict type safety and DTO contracts |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first styling & custom OLED dark theme |
| **Build Tool** | Vite | 6.x | Instant dev compilation & tree-shaken bundling |
| **Testing** | Vitest | 2.1+ | Unit & spatial navigation matrix tests |
| **TV Engine** | Samsung Tizen Web | 2.3 - 9.0 | TV hardware runtime & key registration |
| **Packaging** | Tizen CLI / Docker | `georift/install-jellyfin-tizen` | Signing `.wgt` with Samsung author/distributor |
| **Deployment**| SDB (Smart Development Bridge)| Tizen TV Tools | Wireless device install & execution |

---

## 2. Architectural Invariants

### 1. 10-Foot Spatial Navigation Invariant
* **Hierarchical Row/Shelf Transitions:** The application is organized into horizontal shelves and vertical functional zones. Euclidean math must never cause focus traps across fixed vs scrollable boundaries.
* **Persistent Left Rail Escape:** Pressing **Left** on the leftmost interactive element of any content row (`hero-resume`, Card 0 of shelves, Tab 0, Column 0 of grids) must transition cleanly into the `<Sidebar />` rail.
* **Group Memory & Up Escape:** Leaving the bottom player dock (`<BottomDock />`) by pressing **Up** must restore focus to the last-focused content element or active shelf, never jumping blindly across the screen.
* **Auto-Centering Scroll:** The scroll container must use `block: 'center'` with explicit padding (`pb-44`, `scrollPaddingBottom: 140px`) to prevent focused cards from scrolling beneath the fixed dock.

### 2. State Management & Decoupled Architecture
* **Global Contexts:**
  - `SpatialNavigationContext`: Manages registered focusable DOM nodes, active view, navigation history, and D-pad dispatch.
  - `PlayerContext`: Manages audio playback, queue state, progress tracking, shuffle/repeat, and hardware media key handlers.
  - `ServerContext`: Manages connection configuration, authentication tokens, API client, and cached library vaults.
* **No Direct DOM Mutation Outside Focusables:** Focus state is managed declaratively through `<Focusable focusId="..." group="...">` components that register lifecycle hooks with the spatial navigation provider.

### 3. Tizen Hardware Key Binding Invariant
* Every hardware key (Arrow keys, Enter, Back, MediaPlay, MediaPause, MediaPlayPause, MediaFastForward, MediaRewind) must be registered with `tizen.tvinputdevice.registerKey()` on startup via `src/navigation/tizenKeys.ts`.
* Back key (`keyCode 10009` or `HistoryBack`) must navigate up the internal view history stack before falling back to application exit.

---

## 3. Essential Developer Commands

### Development & Testing
```bash
# Start local development server with HMR
npm run dev -- --host 0.0.0.0 --port 3030

# Run full test suite (spatial math & navigation tests)
npm test

# Run type check & build
npm run build

# Run mandatory Sonzra TV quality gate
bin/quality
```

### Packaging & Deploying to Physical Samsung TV
```bash
# Build, sign with Samsung certificate, install, and launch on TV
./deploy-tv.sh
```

---

## 4. Quality Gate (`bin/quality`)
All commits, pull requests, and implementation tasks must pass:
1. `npm run build`: Zero TypeScript compilation errors (`tsc -b`) and successful Vite production bundle.
2. `npm test`: 100% pass across all unit tests and spatial navigation matrix suites.
