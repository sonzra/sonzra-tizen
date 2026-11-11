# Sonzra Tizen TV: Context & Vision

## 1. High-Level Vision

**Sonzra TV** brings the high-fidelity, audiophile experience of the Sonzra ecosystem to the living room on Samsung Smart TVs (Tizen OS 6.5 - 9.0+). 

While traditional music apps on TV treat the television as a secondary, simplified playback target with generic mobile UI scaled up, Sonzra TV transforms the 65"+ 4K television into a **dedicated listening sanctuary and visual stage**. It pairs bit-perfect, lossless audio playback with rich, tactile artwork, real-time spatial spectrum visualization, rotating vinyl sleeves, and an uncompromising 10-foot remote-controlled experience.

---

## 2. Core Architectural Philosophy

### A. Decoupled TV Client (Hexagonal Boundary)
The TV client is an ultra-lightweight, high-performance web application designed strictly around presentation, remote control ergonomics, and media decoding. It communicates with the **Sonzra Server (Rails API)** via clean, authenticated JSON endpoints and native HTTP streaming.

```
┌────────────────────────────────────────────────────────┐
│               Samsung Smart TV (Tizen)                 │
│  - 10-Foot Spatial Navigation (D-Pad / Remote Keys)    │
│  - Reactive TV UI (React 19 + TypeScript + Tailwind)   │
│  - Persistent Audio Player Dock & Fullscreen Cinema    │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON API + Audio Streams
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Sonzra Server                      │
│  - /api/v1/library (Artists, Albums, Tracks)           │
│  - /api/v1/playback_reports (Scrobble / Resume)        │
│  - /server_connections/:id/audio/:item_id (Stream)     │
│  - /server_connections/:id/artwork/:item_id (Cached)    │
└───────────────────────────┬────────────────────────────┘
                            │ Hexagonal Integration Adapters
                            ▼
┌────────────────────────────────────────────────────────┐
│          Upstream Servers (Jellyfin / Plex / Local)    │
└────────────────────────────────────────────────────────┘
```

### B. The 10-Foot Living Room Paradigm
1. **Remote-First (D-Pad & Hardware Keys):** The primary interaction device is the physical Samsung Smart Control (infrared / Bluetooth remote). There is no mouse cursor and no touch screen. Navigation must be 100% predictable, deterministic, and free of focus traps.
2. **Visual Hierarchy at 10 Feet:** Text, badges, and album art must remain legible from 8 to 12 feet away. Interface chrome sits on ultra-deep OLED dark backgrounds (`#09090F`, `#131319`) with radiant cyan (`#43D7C6`) and neon purple (`#7A5AF8`) glowing focus halos.
3. **Continuous Audio Stage:** Audio never stops playing when browsing libraries, reading album liner notes, or switching views. A persistent mini-player dock anchors the bottom of the screen, with instant 1-button access to the cinema listening room.

---

## 3. Supported Devices & Constraints

* **Platform:** Samsung Tizen OS 6.5, 7.0, 8.0, and 9.0 (2020-2026 models).
* **Target Hardware:** Samsung Neo QLED, OLED, and Crystal UHD Smart TVs (tested on `TQ65QN80FAUXXC`, Tizen 9.0).
* **Resolution:** 1080p rendering canvas scaled by TV hardware scaler to native 4K UHD (`3840x2160`).
* **Input Devices:** Samsung Smart Control (D-pad up/down/left/right, Enter/OK, Return/Back, Play/Pause, Fast Forward, Rewind, Volume, Channel).
* **Package Format:** Tizen `.wgt` signed with official Samsung Developer Certificate (`author.p12` + `distributor.p12` bound to device DUID).
