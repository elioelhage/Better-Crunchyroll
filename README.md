# Better Crunchyroll 🎬

**Better Crunchyroll** is a community-made Chrome/Chromium extension that improves the Crunchyroll watch experience without replacing Crunchyroll's player or service.

It focuses on the things that matter most while watching: cleaner player controls, easier episode navigation, a better fullscreen presentation, spoiler protection, automatic skipping, and a small set of practical quality-of-life improvements.

## ✨ Main Features

### 🎥 Better playback
- **Custom episode title** built directly into the player control bar, styled to fit Crunchyroll's visual language.
- **Fullscreen Back button** for quicker navigation without leaving the player.
- **Dedicated Episodes button** placed with the player controls.
- **Cleaner fullscreen presentation** while keeping Crunchyroll's native video player.

### 📺 Better episode navigation
- Converts the episode collection into a **compact vertical episode list** that is easier to scan.
- **Centers the current episode** when the list opens.
- The Episodes control uses a **progressive fallback system** so it can work across Crunchyroll's different responsive layouts:
  1. Open the native episode UI normally.
  2. If that fails, temporarily spoof the page's responsive viewport without changing the browser's visible zoom.
  3. If that still fails, use the proven **80% tab-zoom fallback** and restore the user's original zoom afterward.
- Improves Discover-page organization by placing **Continue Watching** directly below **Trending in Canada**.

### 🛡️ Spoiler protection
- **Blur upcoming episode thumbnails** so future visuals are less likely to spoil you.
- **Hide upcoming episode titles** while preserving the original episode links and content.
- Designed to handle dynamically rendered and lazy-loaded episode lists.

### ⏭️ Automatic skipping
- Optional automatic skipping for **intros, recaps, and credits**.
- Each skip type can be enabled independently.
- Uses Crunchyroll's own skip-event timing data instead of depending on a visible Skip button.

### ⌨️ Keyboard controls
- **S** — trigger the configured skip action.
- **N** — move to the next episode.
- Both shortcuts can be customized in the extension settings.

### ⚙️ Extension controls
- Large master **On / Off** switch.
- Dedicated settings screen with grouped controls.
- Settings are staged until **Confirm** is pressed.
- Confirming changes reloads the active Crunchyroll tab so the new settings apply cleanly.
- Popup displays the current Better Crunchyroll version.

## 🚀 Installation

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or the equivalent extensions page in a Chromium-based browser.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the Better Crunchyroll folder containing `manifest.json`.
6. Open or reload Crunchyroll and use the extension from the browser toolbar.

## 🧩 Project Structure

```text
Better-Crunchyroll/
├── manifest.json
├── background.js
├── v241-background.js
├── crunchyroll-content.js
├── popup.html
├── popup.js
├── styles.css
├── v221.js
├── v236.js
├── v237.js
├── v241.js
├── icons/
└── README.md
```

## 🌐 Compatibility

- Manifest V3
- Targets `*.crunchyroll.com`
- Designed primarily for modern Chromium-based browsers

## 🛠️ Development approach

Better Crunchyroll is an enhancement layer over the existing Crunchyroll website. It deliberately reuses Crunchyroll's native controls and player where possible instead of replacing the underlying service.

Because Crunchyroll's interface is dynamic and changes its markup and responsive behavior, the extension uses defensive DOM detection, observers, and multiple fallback paths where necessary.

## 📌 Version History

| Version | Highlights |
| --- | --- |
| **2.41** | Episode opening now follows a three-stage responsive strategy: normal opening first, an invisible responsive-viewport spoof second, and the proven 80% tab-zoom fallback only as a final recovery path. The custom episode title is now anchored to the true player center so timer-width changes cannot make it drift. Updated extension versioning and rewritten README. |
| **2.40** | Added the adaptive episode-opening fallback: smaller layouts keep the normal opening path, while failed openings can recover through the temporary 80% zoom method. |
| **2.38** | Skip intro/recap/credits now uses Crunchyroll's own skip-events timing data. Hardened episode-list opening at problematic resolutions and removed the previous-episode shortcut. |
| **2.37** | Refined the in-player episode title with more native-looking typography and positioning. |
| **2.36** | Fixed upcoming-episode title hiding and consolidated spoiler handling into a single spoiler engine. |
| **2.31** | Fixed an episode-list modal regression caused by overly broad DOM observation. |
| **2.30** | Reworked spoiler protection for recreated and lazy-loaded episode lists across show changes and SPA navigation. |
| **2.22** | Added configurable keyboard shortcuts, automatic recap/intro/credits skipping, and optional upcoming-episode spoiler protection. |
| **2.21** | Added current-episode centering, episode-list refinements, and episode-title alignment improvements. |
| **2.20** | Converted the real Crunchyroll episode collection into a vertical list using CSS without reparenting the original episode nodes. |

## ⚠️ Disclaimer

Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project does not provide or redistribute Crunchyroll content.
