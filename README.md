# Better Crunchyroll

**Version 0.2.17** fixes the native episode-list targeting and fullscreen Back control while making the extension enhancements cleanly disable.

## What it does
- Preserves the native Crunchyroll player skin in fullscreen.
- Adds a compact Crunchyroll-style Back control with a transparent idle circle and hover/focus circle.
- Keeps the Back control inside the player shell so it remains available during fullscreen.
- Shows the current episode title in the player controls.
- Adds an episode-list control styled to fit the native player.
- Moves **Continue Watching** directly below **Trending in Canada** on the Discover page.
- Uses the Better Crunchyroll artwork with colored/grayscale icon states and no ON/OFF badge.
- Includes a compact popup with a colored/grayscale logo, enable/disable switch, and version footer.
- Targets the actual visible episode list inside the native episode dialog, not the unrelated page-level video section.
- Converts the visible episode list to a vertical list with smaller left-side thumbnails.
- Keeps episodes ordered **E1 → latest** and scrolls to the episode currently being watched when the list opens.
- Fades watched episodes, including their thumbnails.
- Keeps the episode-list SVG unchanged and shifts only the Back SVG 2px left for optical alignment.
- Removes the extension's injected watch/Discover/list effects when the extension is turned off.

## Version History
| Version | Highlights |
| --- | --- |
| **2.17** | Correct native episode-list container targeting, vertical list layout, current-episode positioning, fullscreen Back control, Back SVG optical alignment, loading-overlay protection, and complete disabled-state cleanup. |
| **2.16** | Reworked the episode-list implementation and popup logo state synchronization. |
| **2.15** | Initial vertical episode-list attempt plus small player-control alignment tweaks. |
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
├── v217.js
├── icons/
└── versions/
```

## Compatibility
The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
