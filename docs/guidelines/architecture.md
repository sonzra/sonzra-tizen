# Sonzra Tizen TV: Architecture Guidelines

## 1. Core Principles

1. **Decoupled Client Architecture:** The TV app contains no business logic regarding media transcoding, metadata scraping, or library scanning. It consumes structured JSON endpoints and standard audio streams provided by the Sonzra Rails server.
2. **Deterministic Spatial State:** All focus states belong to the centralized `SpatialNavigationContext`. Components must never attempt ad-hoc focus management via uncoordinated DOM `.focus()` calls.
3. **Hardware Runtime Isolation:** Native Tizen APIs (`window.tizen`, `window.webapis`) must be wrapped behind defensive checks and abstractions so the app runs and tests cleanly in standard desktop browsers and headless Vitest environments.

---

## 2. Directory & Module Boundaries

```
src/
├── components/          # Reusable presentation components (Sidebar, TopHeader, BottomDock)
├── context/             # Global application contexts (PlayerContext, ServerContext)
├── navigation/          # 10-foot TV spatial navigation engine, math, and hardware keys
│   ├── Focusable.tsx
│   ├── SpatialNavigationContext.tsx
│   ├── spatialMath.ts
│   └── tizenKeys.ts
├── services/            # API clients, local storage, mock datasets
├── types/               # TypeScript interfaces, DTOs, navigation types
└── views/               # Screen-level views (Home, Library, AlbumDetail, NowPlaying, Settings)
```

---

## 3. Spatial Navigation Invariants

* **Node Registration Lifecycle:** Every focusable node must register on mount and unregister on unmount via `<Focusable />`.
* **Group Attribution:** Every `<Focusable />` must declare its semantic group:
  - `sidebar` (Left rail)
  - `bottom-dock` (Persistent player)
  - `hero-actions`, `continue-shelf`, `recent-shelf` (Home view)
  - `library-tabs`, `library-grid` (Library view)
  - `album-actions`, `album-tracks` (Album detail view)
  - `now-playing-header`, `now-playing-controls`, `now-playing-queue` (Now playing cinema view)
* **Zero Focus Traps:** Spatial transitions must obey the hierarchical shelf order. Moving Down never leaps over content rows into the fixed bottom dock. Moving Left from column 0 always escapes into the sidebar rail.

---

## 4. Hardware Key Bindings & Tizen Lifecycle

* Key registration occurs in `registerTizenKeys()` via `tizen.tvinputdevice.registerKey()`.
* Supported TV Hardware Keys:
  - D-Pad Arrows: `37` (Left), `38` (Up), `39` (Right), `40` (Down).
  - Enter / OK: `13` (Select).
  - Return / Back: `10009` (Tizen Return key).
  - Media Keys: `MediaPlay` (415), `MediaPause` (19), `MediaPlayPause` (10252), `MediaFastForward` (417), `MediaRewind` (412).
