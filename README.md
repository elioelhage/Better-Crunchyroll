# Better-Crunchyroll

**Better-Crunchyroll** is a browser extension that improves the Crunchyroll watching experience with better player controls, episode navigation, spoiler protection, automatic skipping, keyboard shortcuts, and other quality-of-life improvements.

## Features

### Better Playback
- Custom in-player **episode title** with responsive sizing and positioning inside the bottom player control bar.
- Compact **Back** control for the fullscreen player.
- Dedicated **episode-list** control integrated into the player controls.
- Cleaner fullscreen presentation while preserving the native Crunchyroll video player.
- Protection against a loading overlay remaining after playback has become available.

### Episode Navigation
- Converts the native episode grid into a **compact vertical episode list**.
- Automatically **centers the current episode** when the episode list opens.
- Keeps **Dub | Sub** metadata visible while episode cards are hovered.
- Adds a compact **custom scrollbar** to the episode-list area.
- Moves **Continue Watching** directly below **Trending in Canada** on the Discover page.

### Spoiler Protection
- **Blur upcoming episode thumbnails** to avoid visual spoilers.
- **Hide upcoming episode titles** while preserving the original Crunchyroll links and episode content.
- Supports dynamically rendered and lazy-loaded episode lists.

### Automatic Skipping
- Optional automatic **intro**, **recap**, and **credits** skipping.
- Each skip type can be enabled independently.

### Keyboard Shortcuts
- **S** — skip an active intro, recap, or credits segment.
- **P** — previous episode.
- **N** — next episode.
- Shortcuts can be customized from the extension settings.

### Settings
- Master **On / Off** control.
- Grouped settings for skipping, keyboard shortcuts, and spoiler protection.
- Settings changes are staged until **Confirm** is pressed.
- Confirming settings reloads the active Crunchyroll tab so changes take effect cleanly.

## Installation

1. Download or clone the repository.
2. Open `chrome://extensions` in Chrome or the equivalent extensions page in a Chromium-based browser.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the Better-Crunchyroll folder containing `manifest.json`.

## Compatibility

- Manifest V3
- Targets `*.crunchyroll.com`
- Designed primarily for modern Chromium-based browsers

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
├── v236.js
├── v237.js
├── icons/
└── versions/
```

## Disclaimer

Better-Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project does not provide or redistribute Crunchyroll content.

---

# Version History

| Version | Highlights |
| --- | --- |
| **2.37** | Refined the in-player episode title with more native-looking typography and a 3px optical lift while keeping it centered inside the bottom player control bar. Existing v2.36 behavior remains intact. |
| **2.36** | Fixed upcoming-episode title hiding: Crunchyroll renders the hover title and the visible card title as separate elements, so both are now hidden. The extension also runs a single spoiler engine instead of loading the legacy v2.32 spoiler implementation alongside it. |
| **2.31** | Fixed the episode-list modal opening regression by removing the global DOM observation loop; spoiler protection remains scoped to episode collections and is refreshed safely after navigation and modal interactions. |
| **2.30** | Reworked spoiler protection to follow recreated/lazy-loaded episode lists across show changes and SPA navigation; upcoming titles are replaced with Episode X when hiding is enabled. |
| **2.29** | Hardened upcoming-episode spoiler protection across Crunchyroll show changes and SPA navigation. |
| **2.26** | Fixed popup view separation/navigation, removed obsolete capture-hint logic, hardened keyboard and skip controls, and ensured disabled spoiler settings have no effect. |
| **2.25** | Main/settings popup separation, full-popup settings view, centered Settings header, Back button, and removal of shortcut helper text. |
| **2.24** | Refined popup flow: balanced main view, dedicated full settings view, scrollable settings, and clear Confirm/apply state. |
| **2.23** | Expanded grouped settings UI, custom toggles, staged Confirm/apply flow with Crunchyroll reload, custom settings scrollbar, and softer/slightly smaller spoiler thumbnail blur. |
| **2.22** | Keyboard shortcuts, automatic recap/intro/credits skipping, and optional upcoming-episode spoiler protection. |
| **2.21** | Episode-list hover metadata fix, current-episode centering, custom scrollbar, and responsive episode-title alignment/hiding. |
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
