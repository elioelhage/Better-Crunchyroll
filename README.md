# Better Crunchyroll

**Version 0.2.19** focuses on the actual rendered episode-list structure used by Crunchyroll.

## What it does
- Preserves the native Crunchyroll player skin in fullscreen.
- Adds a compact Crunchyroll-style Back control with a transparent idle circle and hover/focus circle.
- Shows the current episode title in the player controls.
- Adds an episode-list control styled to fit the native player.
- Moves **Continue Watching** directly below **Trending in Canada** on the Discover page.
- Uses the Better Crunchyroll artwork with colored/grayscale icon states and no ON/OFF badge.
- Includes a compact popup with a colored/grayscale logo, enable/disable switch, and version footer.
- Targets the actual `div.content-wrapper--MF5LS.episode-list-content` wrapper in the open episode dialog.
- Converts the real `.erc-playable-collection > .card` episode tiles inside that wrapper into a vertical list with smaller left-side thumbnails.
- Orders episodes **E1 → latest** and positions the modal on the episode currently being watched.
- Fades watched episodes.
- Keeps the episode-list SVG unchanged and shifts only the Back-button SVG for optical alignment.
- When the extension is turned off, its injected styles, controls, overlays, Discover changes, and episode-list markers are removed.

## Version History
| Version | Highlights |
| --- | --- |
| **2.19** | Targets the actual `content-wrapper--MF5LS.episode-list-content` → `erc-season-episode-list` → `episode-list` → `erc-playable-collection` → `.card` hierarchy and converts the real episode tiles into a vertical list. |
| **2.18** | Back-button optical refinement and episode-list implementation cleanup. |
| **2.17** | Episode-list modal work, fullscreen Back control, extension-off cleanup, and player-control refinements. |
| **2.16** | Reworked the visible episode-list modal and popup logo state synchronization. |
| **2.15** | Initial vertical episode-list attempt plus small player-control alignment tweaks. |
| **2.14** | Corrected Discover feed reordering and restored transparent idle Back-button circle. |
| **2.13** | Initial attempt at video-loading protection and Discover-page Continue Watching reordering. |
| **2.12** | New extension logo, larger popup logo, grayscale/color icon states, and simplified popup. |
| **2.11** | Back-button initial lock reduced to 6.5 seconds; transparent idle Back circle with hover/focus circle. |
| **2.10** | Episode-list control and episode-title/player-control refinements. |

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
├── v219.js
├── icons/
└── versions/
```

## Compatibility
The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
