# Better Crunchyroll 🎬

**Better Crunchyroll** is a community-made Chrome/Chromium extension that improves the Crunchyroll watch experience with cleaner player controls, easier episode navigation, spoiler protection, automatic skipping, and practical quality-of-life improvements.

## ✨ Main Features

### 🎥 Better playback
- **Custom episode title** built into the player control bar.
- **Fullscreen Back button** for quicker navigation without leaving the player.
- **Dedicated Episodes button** integrated with the player controls.
- Cleaner fullscreen presentation while keeping Crunchyroll's native video player.

### 📺 Better episode navigation
- Compact vertical episode-list presentation.
- Current episode is centered when the list opens.
- Native and custom episode-list paths support Crunchyroll's different responsive layouts.
- A short opening animation starts at the oldest episode and moves to the current episode; this animation can be disabled in Settings for long series.

### 🛡️ Spoiler protection
- **Blur upcoming episode thumbnails**.
- **Hide upcoming episode titles** while preserving the original episode links and content.
- Previously passed episodes are not treated as upcoming spoilers.

### ⏭️ Automatic skipping
- Optional automatic skipping for **intros, recaps, and credits**.
- Optional **Go to next episode after credits** behavior.
- Each skip option can be enabled independently.

### ⌨️ Keyboard controls
- **S** — trigger the configured skip action.
- **N** — move to the next episode.
- Shortcuts can be customized in Settings.

### ⚙️ Extension controls
- Master **On / Off** switch.
- Grouped settings with staged **Confirm** behavior.
- Optional **Animate episode list opening** setting, enabled by default.
- Popup displays the current Better Crunchyroll version.

## 🚀 Installation

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or the equivalent extensions page in a Chromium-based browser.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the Better Crunchyroll folder containing `manifest.json`.

## 🌐 Compatibility

- Manifest V3
- Targets `*.crunchyroll.com`
- Designed primarily for modern Chromium-based browsers

## 📌 Version History

| Version | Highlights |
| --- | --- |
| **2.53** | Added a faster episode-list opening animation that starts at the oldest episode and smoothly moves to the current episode. Added a Settings option to disable the animation for long series. Updated version and footer information throughout the release. |
| **2.45** | Added optional **Go to next episode after credits** behavior, allowing the player to move directly to the next episode when the credits begin. |
| **2.44** | Refined episode navigation and the custom episode-list presentation around Crunchyroll's responsive layouts. |
| **2.41** | Added adaptive episode-opening fallbacks and stabilized the in-player episode title against timer-width changes. |
| **2.40** | Added the adaptive episode-opening fallback with the proven 80% zoom recovery path. |
| **2.38** | Hardened episode-list behavior at problematic resolutions and updated automatic skipping to use Crunchyroll's skip-event timing data. |

## ⚠️ Disclaimer

Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project does not provide or redistribute Crunchyroll content.
