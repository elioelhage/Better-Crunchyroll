# Better Crunchyroll

A Firefox build of Better Crunchyroll. This branch is the Firefox source of truth and is kept separate from the Chromium build.

## Features

- Custom player controls
- Episode navigation
- Picture-in-picture window
- Next episode preview
- Spoiler protection
- Automatic intro, recap and credit skipping
- Keyboard shortcuts

## Firefox

- Manifest V3
- Gecko extension ID: `better-crunchyroll@elioelhage`
- Minimum Firefox version: 128
- Declares no required data collection

## Release

Firefox releases are built from this branch by the repository's GitHub Actions release workflow.



| 2.60 | Fixed spoiler protection so the Next Episode hover preview remains clear even when upcoming episode thumbnails are blurred. Updated version metadata to 2.60. |
