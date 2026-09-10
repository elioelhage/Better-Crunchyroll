# Better Crunchyroll

**Version 0.2.26** fixes the popup navigation and hardens the v2.22 settings features so the controls behave predictably when enabled or disabled.

## What it does
- Preserves the stable player and episode-list experience from v2.20/v2.21.
- Keeps the main popup focused on the extension logo, master on/off control, settings button, and version footer.
- Opens a dedicated settings view that replaces the main popup content until the circular Back control is pressed.
- Uses grouped settings for **Skipping**, **Keyboard shortcuts**, and **Blurring & hiding**.
- Uses dedicated on/off toggle controls instead of native HTML checkboxes.
- Stages settings changes locally until **Confirm** is clicked.
- Keeps **Confirm** muted when unchanged and orange when pending changes exist.
- Clicking **Confirm** saves settings and reloads the active Crunchyroll tab.
- Keeps configurable keyboard shortcuts: **S** skip active intro/recap/credits, **P** previous episode, **N** next episode by default.
- Supports independent automatic skipping for **intro**, **recap**, and **credits**, all OFF by default.
- Supports optional spoiler protection: blur upcoming episode thumbnails and hide upcoming episode titles.
- Disabled spoiler settings now remove their attributes completely so they have no visual effect.
- Uses more tolerant matching for Crunchyroll's skip and previous/next episode controls.

## Version History
| Version | Highlights |
| --- | --- |
| **2.26** | Fixed popup view separation/navigation, removed obsolete capture-hint logic, hardened keyboard and skip controls, and ensured disabled spoiler settings have no effect. |
| **2.25** | Main/settings popup separation, full-popup settings view, centered Settings header, circular Back button, and removal of shortcut helper text. |
| **2.24** | Refined popup flow: balanced main view, dedicated full settings view, scrollable settings, and clear Confirm/apply state. |
| **2.23** | Expanded grouped settings UI, custom toggles, staged Confirm/apply flow with Crunchyroll reload, custom settings scrollbar, and softer/slightly smaller spoiler thumbnail blur. |
| **2.22** | Focused settings panel, configurable S/P/N shortcuts, automatic recap/intro/credits skipping, and optional upcoming-episode spoiler protection. |
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
├── v226.js
├── icons/
└── versions/
```

## Compatibility
The extension targets `*.crunchyroll.com` and uses **Manifest V3**.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
