# Better Crunchyroll

**Version 0.2.21** keeps the stable v2.20 episode-list implementation and adds small visual and responsive refinements.

## What it does
- Preserves the native Crunchyroll player skin in fullscreen.
- Keeps the v2.18 Back button and other player controls unchanged.
- Shows the current episode title in the player controls.
- Adds an episode-list control styled to fit the native player.
- Moves **Continue Watching** directly below **Trending in Canada** on the Discover page.
- Uses the Better Crunchyroll artwork with colored/grayscale icon states and no ON/OFF badge.
- Includes a compact popup with the extension logo, enable/disable switch, and version footer.
- Changes only the native `erc-playable-collection state-dt-condensed` episode grid into a vertical list inside the real `erc-episode-list-modal`.
- Keeps Crunchyroll's episode DOM intact: no sorting, cloning, reparenting, or card movement is performed for the list layout.
- Keeps the current episode centered when the episode list is opened.
- Keeps the `Dub | Sub` metadata visible while hovering episode cards.
- Adds a compact gray custom scrollbar to the episode-list scroll region.
- Makes the episode title responsive: it is centered in the actual space between the left and right player control stacks and disappears when there is not enough room.
- Retains the existing extension-off cleanup behavior.

## Version History
| Version | Highlights |
| --- | --- |
| **2.21** | Episode-list hover metadata fix, current-episode centering, custom gray scrollbar, and responsive episode-title alignment/hiding. |
| **2.20** | Safe CSS-only conversion of the real `erc-playable-collection.state-dt-condensed` episode grid into a vertical list; no DOM reparenting and no player-button changes. |
| **2.19** | Targets the actual `content-wrapper--MF5LS.episode-list-content` hierarchy and attempts a full episode-list transformation. |
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
├── v221.js
├── icons/
└── versions/
```

## Compatibility
The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
