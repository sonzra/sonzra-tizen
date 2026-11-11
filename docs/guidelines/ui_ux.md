# Sonzra Tizen TV: UI & UX Guidelines

## 1. The 10-Foot Experience

The 10-foot user experience is fundamentally different from desktop and mobile web experiences:
* **Viewing Distance:** Users sit 8 to 12 feet away from the screen. Small fonts (<14px) and low-contrast borders are invisible.
* **Control Modality:** Directional D-pad buttons only. No touch gestures, no mouse hovering, no drag-and-drop.
* **Overscan & TV Margins:** Television panels often crop or bevel the outer 3-5% of the screen. Critical UI chrome must observe safe-area margins (minimum 40px inset).

---

## 2. Mandatory UI/UX Invariants

### 1. The Radiant Focus Halo
* Every focused element must project a glowing cyan halo:
  ```css
  ring-2 ring-[#43D7C6] shadow-[0_0_24px_rgba(73,220,202,0.55)] scale-[1.03]
  ```
* Focus must never be ambiguous or invisible. Exactly one element must be focused on screen at all times.

### 2. Zero Focus Traps & Continuous Rail Flow
* **Left Escape:** Pressing **Left** from the leftmost element on any row must always transition directly to the Sidebar rail.
* **Vertical Hierarchy:** In scrollable views, pressing **Down** must advance through the shelf hierarchy:
  $$\text{Hero} \to \text{Shelf 1} \to \text{Shelf 2} \to \text{Bottom Dock}$$
* **Dock Up Escape:** Pressing **Up** from the Bottom Player Dock must return directly to the lowest active content shelf, never jumping across the screen to the hero.

### 3. Viewport Scroll Auto-Centering
* Focusing an offscreen or partially visible card must smoothly scroll the card to the vertical center of the viewport (`block: 'center'`).
* The scroll container must maintain bottom clearance (`pb-44`, `scrollPaddingBottom: 140px`) so content never scrolls underneath the fixed bottom dock.

### 4. Audio Continuity
* Background audio playback must never stutter, pause, or reset when the user changes views, explores albums, or browses library vaults.
* The mini-player dock anchors the bottom of all views (except fullscreen cinema mode).
