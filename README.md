# Better Crunchyroll

**Version 0.2.13** improves video-loading reliability and moves Continue Watching directly below Trending in Canada on the Discover page.

## Files
- manifest.json - extension metadata, permissions, icon registration, and content-script registration
- background.js - service worker, enabled/disabled icon state, and version reporting
- crunchyroll-content.js - Crunchyroll page cleanup, player layout, fullscreen shell preservation, and Back-button behavior
- v213.js - v2.13 loading-overlay reliability and Discover-page Continue Watching placement
- popup.html / popup.js / styles.css - compact extension settings popup
- icons/ - Better Crunchyroll logo in orange and grayscale disabled variants

## Load unpacked
1. Open Chrome and go to chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select this Better Crunchyroll folder

## Version 0.2.13
- Fixed a race condition where Better Crunchyroll's loading overlay could remain visible after the video had already become playable or started playing.
- The loading overlay now listens for video readiness and playback events and removes itself when playback is actually available.
- Added a safety check so the loading overlay cannot remain stuck indefinitely.
- On the Crunchyroll Discover page, Continue Watching is moved directly below Trending in Canada.
- No other Discover-page sections are intentionally reordered.

## Version 0.2.12
- Replaced the extension logo with the newly supplied Better Crunchyroll artwork.
- Increased the visible logo size while preserving transparent edges.
- Removed the browser-action ON/OFF badge; enabled/disabled state is communicated by the colored/grayscale extension icon.
- Redesigned the popup around the logo, a centered enable/disable switch, and a simple version footer.
- Removed the previous descriptive header, control-card title, and extra popup content.
- Kept the popup compact so it does not leave unnecessary empty space.
- Updated the popup, background service worker, and manifest to 0.2.12.

## Version 0.2.11
- Back-button initial lock reduced from 9 seconds to 6.5 seconds.
- Back button's circular background is transparent by default.
- Hover/focus adds a subtle circular background consistent with the player controls.
- Back SVG remains unchanged.

## Version 0.2.10
- Episode-list control is exactly 44x44 and uses the supplied white Crunchyroll SVG at 24x24, with no hover size change.
- Episode title moved 3px downward to align more closely with the native bottom controls.
- Back-button initial lock remains 9 seconds, but the countdown starts from the current video's play event rather than page/player discovery.

## Disclaimer
Better Crunchyroll is an independent community project and is not affiliated with, sponsored by, or endorsed by Crunchyroll LLC.

Crunchyroll is a trademark of its respective owner. This project is intended as a personal/community enhancement and does not provide or redistribute Crunchyroll content.
