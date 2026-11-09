# Sonzra Samsung TV (Tizen) Client

Standalone Smart TV client application for **Sonzra**, built specifically for the **Samsung Tizen TV** platform (Tizen OS 6.0+) and optimized for a modern, distraction-free **10-foot listening room experience**.

---

## 1. Overview & Key Capabilities

- **10-Foot Spatial Navigation**: Fully custom 2D Euclidean spatial navigation engine supporting D-pad arrows (`Up`, `Down`, `Left`, `Right`), `Enter` (select/trigger), and hardware `Return`/`Back` (`10009` / `Escape`).
- **Samsung Hardware Remote Integration**: Automatically registers Samsung TV multimedia keys via `window.tizen.tvinputdevice.registerKey` (`MediaPlay`, `MediaPause`, `MediaPlayPause`, `MediaTrackPrevious`, `MediaTrackNext`, `MediaStop`).
- **1080p Canvas & 4K TV Scaling**: Fixed 1920x1080 viewport baseline (`<tizen:metadata key="http://samsung.com/tv/metadata/use.realsize" value="true"/>`) ensuring razor-sharp typography and layout consistency across Full HD and 4K UHD panels.
- **Sonzra Redesign Theme**: Scoped dark aesthetic adhering to Sonzra's design tokens (`#09090F` deep space black, `#7A5AF8` primary purple, `#43D7C6` equalizer cyan, `#9B82FF` focus glows).
- **Persistent Audio Engine**: Continuous HTML5 audio streaming with audio buffer management, queue advancement, shuffle, repeat-all, repeat-one, seek scrubber, and mini-player continuity across screen navigation.
- **Standalone Demo Mode + Sonzra API**: Operates seamlessly in offline/demo mode out of the box with sample audio streams and connects to self-hosted Sonzra media servers via `/server_connections/:id/audio/:item_id`.

---

## 2. Project Structure

```
/root/Projects/sonzra-tizen/
├── config.xml                      # Samsung Tizen TV Web Widget configuration
├── index.html                      # 1920x1080 viewport entry with Tizen WebAPI stubs
├── package.json                    # Scripts and dependencies (Vite + React + TypeScript)
├── tsconfig.json                   # Strict TypeScript compiler options
├── vite.config.ts                  # Bundler config with relative asset base (./) for Tizen
├── public/
│   ├── config.xml                  # Bundled into dist/ for packaging
│   ├── icon.png                    # 512x512 Samsung TV application icon
│   └── sonzra-mark.svg             # Sonzra brand vector asset
├── src/
│   ├── main.tsx                    # React application bootstrap
│   ├── App.tsx                     # Main layout & router
│   ├── index.css                   # 10-foot CSS design system tokens and TV focus states
│   ├── types/
│   │   ├── music.ts                # Track, Album, Artist, QueueState models
│   │   ├── navigation.ts           # Direction, FocusableNode, ActiveView types
│   │   └── tizen.d.ts              # Samsung Tizen & WebAPIs TypeScript declarations
│   ├── navigation/
│   │   ├── spatialMath.ts          # 2D Euclidean spatial navigation algorithm
│   │   ├── SpatialNavigationContext.tsx # Global focus manager and remote listener
│   │   ├── Focusable.tsx           # Declarative focusable node wrapper
│   │   ├── tizenKeys.ts            # Samsung Tizen hardware key definitions & registration
│   │   └── __tests__/              # Unit tests for spatial navigation
│   ├── context/
│   │   ├── PlayerContext.tsx       # HTML5 Audio playback engine and queue manager
│   │   └── ServerContext.tsx       # Sonzra server configuration and library cache
│   ├── services/
│   │   ├── sonzraApi.ts            # Sonzra backend client & streaming endpoints
│   │   ├── mockData.ts             # Built-in demo albums and playable MP3 streams
│   │   └── storage.ts              # Persistent configuration in localStorage
│   ├── components/
│   │   ├── Sidebar.tsx             # Left navigation rail with active playing indicator
│   │   ├── MiniPlayer.tsx          # Persistent floating mini-player
│   │   ├── EqualizerBars.tsx       # CSS animated audio wave visualizer
│   │   ├── FocusableCard.tsx       # TV cards with 1.05 scale and purple glow focus
│   │   └── FocusableButton.tsx     # High contrast 10-foot action buttons
│   └── views/
│       ├── AlbumsView.tsx          # Responsive album grid
│       ├── AlbumDetailView.tsx     # Cover art, album metadata, and tracklist table
│       ├── ArtistsView.tsx         # Circular artist cards grid
│       ├── ArtistDetailView.tsx    # Artist hero banner, discography, and top tracks
│       ├── NowPlayingView.tsx      # Fullscreen player with ambient blur & scrubber
│       └── SettingsView.tsx        # Server connection setup, test tool & TV diagnostics
```

---

## 3. Remote Control Mapping

| Remote Button | Key Code / Key Name | Action |
| :--- | :--- | :--- |
| **D-Pad Up / Down / Left / Right** | `38`, `40`, `37`, `39` | Move spatial focus geometrically |
| **Enter / Select (OK)** | `13` (`Enter`) | Open album/artist, activate button, play track |
| **Return / Back** | `10009` (`Escape`) | Return to previous view or jump to Sidebar |
| **Media Play / Pause** | `10252` (`MediaPlayPause`) | Toggle track playback |
| **Media Play** | `415` (`MediaPlay`) | Resume audio playback |
| **Media Pause** | `19` (`MediaPause`) | Pause audio playback |
| **Media Next** | `10233` (`MediaTrackNext`) | Skip to next track in queue |
| **Media Previous** | `10232` (`MediaTrackPrevious`) | Skip to previous track or restart track |
| **Scrubber Left / Right** | (When Scrubber focused) | Seek backward/forward by 10 seconds |

---

## 4. 10-Foot Spatial Navigation Architecture

1. **Euclidean Directional Scoring**:
   Candidate elements are detected based on directional cones (`spatialMath.ts`).
   $$\text{Score} = \text{PrimaryDistance} + (2.5 \times \text{OrthogonalDistance})$$
   This heavily penalizes orthogonal misalignment, ensuring natural TV remote movement.
2. **Visual Focus Feedback**:
   - Focus ring: `3px solid var(--rz-primary-light)` (`#9b82ff`)
   - Outer glow: `box-shadow: 0 0 24px rgba(122, 90, 248, 0.45)`
   - Scaling: `transform: scale(1.05)` with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
3. **Viewport Continuity**:
   Every focus change invokes `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` so active elements are never clipped by the TV bezel.

---

## 5. Development & Local Testing

### Prerequisites
- Node.js >= 18 (Tested on v26)
- npm >= 9

### Install Dependencies
```bash
npm install
```

### Run Local Vite Dev Server
```bash
npm run dev
```
Open `http://localhost:3030` in your web browser. You can use your computer's Arrow keys, Enter, and Escape to test TV remote navigation.

### Run Unit Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```
Generates production assets in `dist/` with relative file links (`./assets/...`) compatible with Tizen packaging.

---

## 6. Packaging & Deployment to Samsung Smart TV

### Prerequisites: Tizen Studio CLI
Install the **Tizen Studio & TV Extension** from Samsung Developers:
- [Samsung Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk.html)
- Ensure `tizen` CLI and `sdb` (Samsung Debug Bridge) are in your `PATH`.

### Step 1: Create or Import Author & Distributor Certificates
```bash
# Generate certificate profile (or use Samsung Certificate Extension in Tizen Studio)
tizen security-profiles add -n SonzraProfile -a /path/to/author.p12 -p authorPassword -d /path/to/distributor.p12 -dp distributorPassword
```

### Step 2: Build and Package Web Application
```bash
# 1. Build optimized web bundle
npm run build

# 2. Package into Tizen .wgt package
tizen package -t wgt -s SonzraProfile -- dist
```
This produces `dist.wgt` (or `SonzraTV.wgt`).

### Step 3: Install on Samsung Smart TV via SDB
1. Turn on **Developer Mode** on your Samsung Smart TV:
   - Go to **Smart Hub** -> **Apps**
   - Press remote sequence `1`, `2`, `3`, `4`, `5`
   - Switch Developer Mode to **ON** and enter your computer's Host IP address.
   - Reboot TV (hold power button on remote for 3 seconds).
2. Connect to TV over local network:
   ```bash
   sdb connect <TV_IP_ADDRESS>
   sdb devices
   ```
3. Install and Launch:
   ```bash
   tizen install -n SonzraTV.wgt -t <TV_DEVICE_NAME>
   tizen run -p org.sonzra.tizen -t <TV_DEVICE_NAME>
   ```

---

## 7. Connecting to a Self-Hosted Sonzra Server

1. From the TV app's sidebar, navigate down to **Settings** and press `Enter`.
2. In **Sonzra Host / Server URL**, enter your server address (e.g., `http://192.168.1.150:3000`).
3. Enter the **Active Server Connection ID** (e.g. `1`).
4. (Optional) Enter your **Authentication Token / Bearer Key**.
5. Select **Test Connection** to check network reachability and roundtrip latency.
6. Toggle **Standalone Demo Mode** off to load your personal music library.
7. Click **Save & Connect**.
