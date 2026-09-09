# Better Crunchyroll

An independent Chrome extension focused on improving the Crunchyroll web viewing experience while preserving the native player wherever possible.

## Current Release

**v2.11**

The current release focuses on the watch page and fullscreen player experience.

### What it does

- Preserves the native Crunchyroll video-player skin in fullscreen.
- Adds a compact Crunchyroll-style Back control.
- Shows the Back control after the initial playback lock and hides it after inactivity.
- Keeps the Back control's circular background transparent when idle, with a subtle circle appearing on hover/focus.
- Shows the current episode title in the player controls.
- Adds an episode-list control styled to fit the native player.
- Keeps the native **Next Episode** control available.
- Includes a simplified popup with an animated on/off toggle.
- Uses the Better Crunchyroll extension artwork, including a grey disabled state.

## Design Goals

Better Crunchyroll is intentionally designed around a simple principle: **improve the experience without fighting the native Crunchyroll player**.

The player additions are kept compact and visually consistent with the surrounding controls. Native Crunchyroll functionality is preferred whenever it is available instead of recreating the same behavior from scratch.

## Version History

The project has evolved through a series of small, focused iterations:

| Version | Highlights |
| --- | --- |
| **2.11** | Back-button initial lock reduced to 6.5 seconds; transparent idle Back circle with hover/focus circle. |
| **2.10** | Player control refinements, episode title/list controls, 9-second Back lock, sizing and hover polish. |
| **2.9** | Episode title positioning and episode-list control polish. |
| **2.8** | Stable rebuild of the episode-control implementation. |
| **2.7** | Added episode title and episode-list functionality. |
| **2.6** | Back-control positioning and timing refinements. |
| **2.5** | Icon-only Back control, 6-second fade, larger extension icon. |
| **2.4** | Crunchyroll Back SVG, icon states, native Next Episode preservation. |
| **2.3** | Back-control auto-hide and simplified popup. |
| **2.2** | Restored the native Crunchyroll player skin in fullscreen. |

## Installation (Developer Mode)

1. Download or clone the repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the extension directory containing `manifest.json`.

## Project Structure

```text
Better-Crunchyroll/
├── manifest.json
├── crunchyroll-content.js
├── background.js
├── popup.html
├── popup.js
├── styles.css
├── icons/
└── versions/
```

## Compatibility

The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer

Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
