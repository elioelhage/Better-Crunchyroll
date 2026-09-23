# Better Crunchyroll 🎬

**Better Crunchyroll** is a community-made browser extension that improves the Crunchyroll watch experience while keeping Crunchyroll's familiar look and native player.

It is developed for **Chromium-based browsers (Chrome/Edge)** and **Firefox**, with browser-specific builds where necessary.

## ✨ Main Features

### 🎥 Better playback
- **Custom episode title** built into the player control bar.
- **Fullscreen Back button** for quicker navigation without leaving the player.
- **Dedicated Episodes button** integrated with the player controls.
- **Picture-in-picture** with a Better Crunchyroll floating window, including compact, larger, and fullscreen stages where supported.
- Cleaner fullscreen presentation while keeping Crunchyroll's native video player.

### 📺 Better episode navigation
- Compact vertical episode-list presentation.
- Current episode is centered when the list opens.
- Responsive fallbacks support Crunchyroll's different layouts.
- A short opening animation starts at the oldest episode and moves to the current episode; this can be disabled in Settings for long series.

### 🛡️ Spoiler protection
- **Blur upcoming episode thumbnails**.
- **Hide upcoming episode titles** while preserving the original episode links and content.
- The Next Episode preview follows the same spoiler settings.

### ⏭️ Automatic skipping
- Optional automatic skipping for **intros, recaps, and credits**.
- Optional **Go to next episode after credits** behavior.
- Final-episode credits are never skipped automatically.

### ⌨️ Keyboard controls
- **S** — trigger the configured skip action.
- **N** — move to the next episode.
- Shortcuts can be customized in Settings.

## 🌐 Browser support

| Browser | Build |
| --- | --- |
| **Chrome** | Chromium build |
| **Microsoft Edge** | Chromium build |
| **Firefox** | Firefox-specific build |

The Firefox version is maintained separately because Firefox requires browser-specific manifest configuration and can require small compatibility changes that do not belong in the Chromium build.

## 🌿 Repository branches

- **`main`** — Chromium source of truth for Chrome/Edge.
- **`main-firefox`** — Firefox source of truth.
- Older release branches are historical/development branches.

## 🚀 Installation

### Chrome / Edge
1. Download or clone the repository.
2. Open the browser's extensions page.
3. Enable Developer mode.
4. Load the Chromium build as an unpacked extension.

### Firefox
Use the Firefox build from **`main-firefox`** or the published Better Crunchyroll listing on Mozilla Add-ons.

## 📌 Version History

| Version | Highlights |
| --- | --- |
| **2.98** | Added configurable seek amount, Next Episode hover preview functionality, and related playback/episode-flow features; removed the subtitle toggle from Settings. |
| **2.59** | Fixed the Next Episode hover preview so it reads Crunchyroll's own “up next” widget directly. The popup now animates between the main page and Settings. |
| **2.58** | Added the Next Episode hover preview, refined control-button hover circles, and made Better Crunchyroll's PiP window the default where supported. |
| **2.57** | Added the Better Crunchyroll PiP window with compact, larger, and fullscreen stages. |
| **2.56** | Added the PiP button beside fullscreen and the Stripe donation link. |
| **2.55** | Improved final-episode credit behavior, skip-data retries, and loading animation. |
| **2.54** | Stabilized the Episodes button and fullscreen episode-list fallback. |

## ⚠️ Disclaimer

Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project does not provide or redistribute Crunchyroll content.