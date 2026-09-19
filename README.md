# Better Crunchyroll

A Chrome/Chromium extension that cleans up the Crunchyroll watch page: a custom control bar, easier episode navigation, spoiler protection, automatic skipping, and picture-in-picture.

## Features

**Player**
- Episode title in the control bar
- Back button in fullscreen
- Episodes button next to the player controls
- Picture-in-picture button, right next to fullscreen

**Picture in picture**
- Own floating window with three sizes: compact, larger (double-click, or the size button) and fullscreen
- Play/pause, seek bar, mute, skip intro/recap/credits button, keyboard shortcuts (Space, arrows, M, F, plus your skip/next keys)
- Remembers the last size; falls back to the browser's built-in PiP where the custom window isn't supported

**Episode list**
- Compact vertical list, centered on the current episode
- Opening animation (starts at the oldest episode, scrolls to the current one), can be turned off in Settings

**Next episode preview**
- Hover the Next Episode button to see a small card above it with the next episode's thumbnail and title
- Follows the spoiler settings below (blurred thumbnail, hidden title), and can be turned off in Settings

**Spoilers**
- Blur thumbnails of upcoming episodes
- Hide titles of upcoming episodes

**Skipping**
- Auto-skip intros, recaps and credits (each one is a separate setting, on by default)
- Optional "go to next episode after credits"
- The credits of a series' final episode are never skipped automatically

**Shortcuts**
- `S` skips the current intro/recap/credits, `N` goes to the next episode. Both can be changed in Settings.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and enable Developer mode.
3. Click Load unpacked and select the folder that contains `manifest.json`.

Manifest V3, Chromium-based browsers, `*.crunchyroll.com` only.

## Changelog

| Version | Changes |
| --- | --- |
| 2.59 | Fixed the Next Episode hover preview: it now reads Crunchyroll's own "up next" widget directly instead of trying to infer the next episode from the (modal-only) episode list, so it works right away instead of only after opening the episode list once. Popup now animates between the main page and Settings instead of switching instantly. |
| 2.58 | Hovering Next Episode shows a preview card with the next episode's thumbnail and title (setting in the spoilers section). Hover circles on the back, episodes and picture-in-picture buttons now share one darker gray. The picture-in-picture window setting is gone: the button always opens the Better Crunchyroll window when the browser supports it. |
| 2.57 | Hover circle on the control buttons no longer shrinks them, and is a lighter neutral gray on all three buttons. Picture-in-picture is now its own window with compact, larger and fullscreen stages, with a setting to switch back to the browser's PiP. Both support links share a row. |
| 2.56 | Picture-in-picture button next to fullscreen. Stripe donation link in the popup. Removed dead code and unused files. |
| 2.55 | Credits of the final episode are never auto-skipped. Failed skip-data lookups are retried. Loading animation matches Crunchyroll's. Skipping is on by default. Donation link in the popup. |
| 2.54 | Episodes button keeps its slot on the final episode. Custom episode list opens over fullscreen. |
| 2.53 | Faster episode-list opening animation, with a setting to turn it off. |
| 2.45 | "Go to next episode after credits" option. |
| 2.44 | Episode navigation tweaks for responsive layouts. |
| 2.41 | Fallbacks for opening the episode list, steadier in-player title. |
| 2.40 | Zoom-based fallback for opening the episode list. |
| 2.38 | Skipping now uses Crunchyroll's skip-event timings. |

## Disclaimer

Independent community project, not affiliated with or endorsed by Crunchyroll LLC. It does not provide or redistribute Crunchyroll content.