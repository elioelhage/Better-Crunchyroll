# Better Crunchyroll

**Version 0.2.15** refines the watch-page episode controls and episode-list layout.

## What it does
- Preserves the native Crunchyroll player skin in fullscreen.
- Adds a compact Crunchyroll-style Back control with a transparent idle circle and hover/focus circle.
- Shows the current episode title in the player controls.
- Adds an episode-list control styled to fit the native player.
- Moves **Continue Watching** directly below **Trending in Canada** on the Discover page.
- Uses the Better Crunchyroll artwork with colored/grayscale icon states and no ON/OFF badge.
- Includes a compact popup with the extension logo, enable/disable switch, and version footer.
- Converts the episode list to a vertical list with smaller side thumbnails, earliest-to-latest ordering, watched-state fading, and automatic positioning on the current episode.
- Fine-tunes the centered episode title by moving it 3px downward and shifts the episode-list SVG slightly left for optical alignment.

## Version History
| Version | Highlights |
| --- | --- |
| **2.15** | Vertical episode list with side thumbnails, current-episode positioning, watched-state fading, and small player-control alignment tweaks. |
| **2.14** | Corrected Discover feed reordering and restored transparent idle Back-button circle. |
| **2.13** | Initial attempt at video-loading protection and Discover-page Continue Watching reordering. |
| **2.12** | New extension logo, larger popup logo, grayscale/color icon states, and simplified popup. |
| **2.11** | Back-button initial lock reduced to 6.5 seconds; transparent idle Back circle with hover/focus circle. |
| **2.10** | Episode-list control and episode-title/player-control refinements. |
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
├── v213.js
├── v215.js
├── icons/
└── versions/
```

## Compatibility
The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
