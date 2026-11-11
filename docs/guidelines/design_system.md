# Sonzra Tizen TV: Design System Guidelines

## 1. Visual Token Architecture

The design system is implemented with Tailwind CSS v3 using custom semantic color tokens configured in `tailwind.config.js`:

```javascript
colors: {
  background: '#09090F',              // Deep OLED space background
  'on-background': '#E2E1E6',
  surface: '#131319',
  'surface-dim': '#0E0E14',
  'surface-bright': '#232228',
  'surface-container-lowest': '#09090F',
  'surface-container-low': '#131319',
  'surface-container': '#17171E',
  'surface-container-high': '#1C1B20',
  'surface-container-highest': '#232228',
  'on-surface': '#E2E1E6',
  'on-surface-variant': '#91909A',
  primary: '#7A5AF8',                 // Radiant Neon Purple
  'primary-container': '#2F1155',
  'on-primary': '#FFFFFF',
  'on-primary-container': '#EADBFF',
  secondary: '#43D7C6',               // Glowing Cyan Focus Halo
  'secondary-container': '#005047',
  'on-secondary': '#003730',
  'on-secondary-container': '#6FF7E4',
  outline: '#91909A',
  'outline-variant': '#47464F',
  error: '#FFB4AB',
}
```

---

## 2. Typography Rules

* **Headings / Master Titles:** `font-serif-title` (`Cinzel`, serif) — used for master hero album titles and section headers.
* **UI Controls & Labels:** `font-label-lg`, `font-label-md` (`Manrope`, sans-serif) — used for buttons, navigation rail icons, card titles, and artist credits.
* **Timers & Telemetry:** `font-mono` (`JetBrains Mono`, monospace) — used for track durations, elapsed time counters, sample rates, and bit depths (`tabular-nums`).

---

## 3. Focus Indicator Classes

* **Card Component:**
  ```tsx
  className={`transition-all duration-200 ${
    isFocused
      ? 'bg-surface-container ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.4)] scale-[1.03] z-10'
      : 'bg-surface-container-low hover:bg-surface-container shadow-md'
  }`}
  ```
* **Pill / Button Component:**
  ```tsx
  className={`transition-all duration-200 ${
    isFocused
      ? 'bg-primary-container text-on-primary-container ring-2 ring-secondary shadow-[0_0_28px_rgba(122,90,248,0.8)] scale-105'
      : 'bg-primary-container/90 text-on-primary-container shadow-md'
  }`}
  ```
