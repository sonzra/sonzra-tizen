# Sonzra Tizen TV: Brand & Visual Identity

## 1. Aesthetic Identity: "The Quiet Audiophile Living Room"

Sonzra TV's visual language is tailored for high-end living room environments with large OLED and Neo QLED panels. The interface is dark, cinematic, and non-fatiguing, allowing high-resolution album artwork to shine while maintaining instant legibility at 10 feet.

---

## 2. Color Palette & Surface Hierarchy

```
Deep Space Background        Card & Shelf Surfaces        Radiant Accents
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│ #09090F               │   │ #131319               │   │ #43D7C6 (Cyan)        │
│ Canvas / OLED Deep    │   │ Surface Container Low │   │ Active Focus Halo     │
├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
│ #0E0E14               │   │ #1C1B20               │   │ #7A5AF8 (Neon Violet) │
│ Header / Rails Backdrop│   │ Surface High          │   │ Primary Brand / Vinyl │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

### Color Tokens
* **Background (`#09090F`):** Deep, pure dark canvas optimized for OLED blacks and zero backlight bleed.
* **Surface Container Low (`#131319`):** Subtle elevated containers for media cards and shelves.
* **Surface Container High (`#1C1B20`):** Elevated cards, pills, and navigation backgrounds.
* **Primary / Violet (`#7A5AF8`):** Brand energy, master vinyl labels, atmospheric ambient backdrops.
* **Secondary / Cyan (`#43D7C6`):** The universal focus halo, active playback indicator, and bit-perfect telemetry badges.
* **Text / On-Surface (`#E2E1E6`):** High-contrast, warm white typography with tabular font numerics.
* **Outline / Muted (`#91909A`):** Low-contrast secondary metadata and track durations.

---

## 3. Typography System

* **Display & Master Headings:** `Cinzel` / `serif-title` (Roman stone engraving style with classical majesty).
* **UI Controls & Body Text:** `Manrope` (Clean, geometric neo-grotesque sans-serif with high legibility at 10ft viewing distances).
* **Telemetry & Bit-Perfect Badges:** `JetBrains Mono` / `font-mono` (Tabular numbers for timers, bitrates, sample rates, and kHz indicators).

---

## 4. Focus Rings & Halo Shaders

On a 10-foot TV display, the focused element must be unmistakably clear from across the room:
* **Focus Ring:** `ring-2 ring-[#43D7C6] ring-offset-2 ring-offset-[#09090F]`
* **Focus Shadow Glow:** `shadow-[0_0_24px_rgba(67,215,198,0.55)]`
* **Focus Scale:** `transform scale-[1.03]` (for large cards) or `scale-[1.08]` (for round action buttons).
* **Focus Duration:** `transition-all duration-200 ease-out` (rapid response to D-pad presses with no sluggish delays).
