(() => {
  'use strict';

  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const CUSTOM_MODAL_ID = 'better-crunchyroll-custom-episode-modal';
  const AUTO_NEXT_KEY = 'betterCrunchyrollAutoNextAfterCredits';
  const SKIP_EVENTS_MESSAGE = 'betterCrunchyrollSkipEvents';
  const SKIP_EVENT_REFRESH_MS = 3000;

  let positionRaf = 0;
  let nextMissingSince = 0;
  let boundVideo = null;
  let mediaId = null;
  let creditWindows = [];
  let creditRequest = null;
  let autoNextAfterCredits = false;
  let settingsLoaded = false;

  function visible(element) {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function findNextEpisodeButton() {
    return Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .filter(visible)
      .find((element) => {
        if (element.id === EPISODE_BUTTON_ID) return false;
        if (element instanceof HTMLButtonElement && element.disabled) return false;
        if (element.getAttribute('aria-disabled') === 'true') return false;
        if (element.getAttribute('data-better-crunchyroll-hidden') === 'true') return false;
        const text = [
          element.getAttribute('aria-label') || '',
          element.getAttribute('title') || '',
          element.textContent || '',
        ].join(' ').replace(/\s+/g, ' ').trim();
        return /^next\s+episode$/i.test(text) || /next\s+episode/i.test(text);
      }) || null;
  }

  function findCaptionsControl(rightStack) {
    const selectors = [
      '[data-testid*="captions" i]',
      '[data-testid*="subtitle" i]',
      'button[aria-label*="captions" i]',
      'button[title*="captions" i]',
      'button[aria-label*="subtitles" i]',
      'button[title*="subtitles" i]',
      '[role="button"][aria-label*="captions" i]',
      '[role="button"][aria-label*="subtitles" i]',
    ];
    return selectors.flatMap((selector) => Array.from(rightStack.querySelectorAll(selector)))
      .find((element) => element.id !== EPISODE_BUTTON_ID) || null;
  }

  function repairEpisodeButtonPosition() {
    positionRaf = 0;
    const button = document.getElementById(EPISODE_BUTTON_ID);
    const autoHide = document.querySelector('[data-testid="bottom-controls-autohide"]');
    const rightStack = autoHide?.querySelector('[data-testid="bottom-right-controls-stack"]');
    if (!(button instanceof HTMLElement) || !(rightStack instanceof HTMLElement)) return;

    const nextEpisode = rightStack.querySelector('[data-testid="next-episode-button"]');
    const nextWrapper = nextEpisode?.parentElement;
    if (nextWrapper && nextWrapper.parentElement === rightStack) {
      nextMissingSince = 0;
      if (button.nextElementSibling !== nextWrapper || button.parentElement !== rightStack) {
        nextWrapper.insertAdjacentElement('afterend', button);
      }
      return;
    }

    // v2.54: when Crunchyroll removes Next Episode on the final episode,
    // keep Better Crunchyroll's Episodes control in its established slot,
    // immediately to the left of Captions instead of appending it to the far right.
    nextMissingSince ||= performance.now();
    const captions = findCaptionsControl(rightStack);
    if (!captions) {
      if (button.parentElement !== rightStack) rightStack.appendChild(button);
      return;
    }

    if (captions.parentElement?.parentElement === rightStack) {
      const captionsWrapper = captions.parentElement;
      if (button.parentElement !== rightStack || captionsWrapper.previousElementSibling !== button) {
        captionsWrapper.insertAdjacentElement('beforebegin', button);
      }
      return;
    }

    if (captions.parentElement === rightStack && captions.previousElementSibling !== button) {
      captions.insertAdjacentElement('beforebegin', button);
    }
  }

  function schedulePositionRepair() {
    if (positionRaf) return;
    positionRaf = window.requestAnimationFrame(repairEpisodeButtonPosition);
  }

  function mountCustomModalForFullscreen() {
    const modal = document.getElementById(CUSTOM_MODAL_ID);
    if (!(modal instanceof HTMLElement)) return;

    const fullscreenElement = document.fullscreenElement;
    let parent = document.documentElement;
    if (fullscreenElement instanceof HTMLElement) {
      parent = fullscreenElement instanceof HTMLVideoElement
        ? (fullscreenElement.parentElement || document.documentElement)
        : fullscreenElement;
    }

    if (modal.parentElement !== parent) parent.appendChild(modal);
    modal.toggleAttribute('data-better-crunchyroll-fullscreen', Boolean(fullscreenElement));
  }

  function observePlayer() {
    const observer = new MutationObserver(() => {
      schedulePositionRepair();
      mountCustomModalForFullscreen();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'disabled'],
    });

    window.addEventListener('resize', schedulePositionRepair, { passive: true });
    document.addEventListener('fullscreenchange', () => {
      schedulePositionRepair();
      mountCustomModalForFullscreen();
    });
  }

  function requestSkipEvents(currentMediaId) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: SKIP_EVENTS_MESSAGE, mediaId: currentMediaId }, (response) => {
          if (chrome.runtime.lastError) {
            resolve([]);
            return;
          }
          resolve(Array.isArray(response) ? response : []);
        });
      } catch {
        resolve([]);
      }
    });
  }

  function getMediaId(video = boundVideo) {
    const routeMatch = location.pathname.match(/\/watch\/([A-Za-z0-9]+)/i);
    if (routeMatch) return routeMatch[1];
    const source = video?.currentSrc || video?.src || '';
    const match = source.match(/([A-Za-z0-9]{8,})/);
    return match ? match[1] : null;
  }

  async function refreshCreditsForVideo(video) {
    const currentMediaId = getMediaId(video);
    if (!currentMediaId) {
      mediaId = null;
      creditWindows = [];
      creditRequest = null;
      return;
    }
    if (currentMediaId === mediaId && creditWindows.length) return;
    mediaId = currentMediaId;
    if (creditRequest) return;

    const requestMediaId = mediaId;
    creditRequest = requestSkipEvents(requestMediaId)
      .then((events) => {
        if (mediaId !== requestMediaId) return;
        creditWindows = events
          .filter((event) => event?.type === 'credits' && Number.isFinite(event.start) && Number.isFinite(event.end) && event.end > event.start)
          .map((event) => ({ start: Number(event.start), end: Number(event.end) }));
      })
      .finally(() => {
        creditRequest = null;
      });
    await creditRequest;
  }

  function loadSettings() {
    try {
      chrome.storage.local.get({ [AUTO_NEXT_KEY]: false }, (stored) => {
        autoNextAfterCredits = Boolean(stored?.[AUTO_NEXT_KEY]);
        settingsLoaded = true;
      });
    } catch {
      settingsLoaded = true;
    }
  }

  function isCreditTime(video) {
    const time = Number(video?.currentTime);
    return creditWindows.find((window) => time >= window.start && time < window.end) || null;
  }

  function skipFinalEpisodeCredits(video, window) {
    if (!window || !Number.isFinite(window.end)) return;
    const duration = Number(video.duration);
    const safeEnd = Number.isFinite(duration) && duration > 0
      ? Math.min(window.end, duration - 0.25)
      : window.end;
    const target = Math.max(window.start, safeEnd);
    if (target <= video.currentTime + 0.05) return;
    video.currentTime = target;
  }

  function handleCreditTimeUpdateCapture(event) {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement) || !settingsLoaded || !autoNextAfterCredits) return;

    void refreshCreditsForVideo(video);
    const creditWindow = isCreditTime(video);
    if (!creditWindow) return;

    const nextButton = findNextEpisodeButton();
    if (nextButton) {
      nextMissingSince = 0;
      return;
    }

    // Give Crunchyroll's control layer a moment to render before declaring the
    // missing Next Episode action to be the final-episode case.
    if (!nextMissingSince) nextMissingSince = performance.now();
    if (performance.now() - nextMissingSince < 250) return;

    // v2.54: final episode — skip the credits segment only. Do not attempt to
    // advance to a nonexistent next episode, preserving any post-credit scene.
    skipFinalEpisodeCredits(video, creditWindow);
  }

  function bindVideo(video) {
    if (!(video instanceof HTMLVideoElement) || video === boundVideo) return;
    if (boundVideo) {
      boundVideo.removeEventListener('timeupdate', handleCreditTimeUpdateCapture, true);
      boundVideo.removeEventListener('loadedmetadata', onVideoMetadata);
      boundVideo.removeEventListener('play', onVideoPlay);
    }
    boundVideo = video;
    mediaId = null;
    creditWindows = [];
    nextMissingSince = 0;
    video.addEventListener('timeupdate', handleCreditTimeUpdateCapture, true);
    video.addEventListener('loadedmetadata', onVideoMetadata);
    video.addEventListener('play', onVideoPlay);
    void refreshCreditsForVideo(video);
  }

  function onVideoMetadata() {
    nextMissingSince = 0;
    void refreshCreditsForVideo(boundVideo);
  }

  function onVideoPlay() {
    void refreshCreditsForVideo(boundVideo);
  }

  function findAndBindVideo() {
    const video = document.querySelector('video');
    if (video instanceof HTMLVideoElement) bindVideo(video);
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[AUTO_NEXT_KEY]) {
      autoNextAfterCredits = changes[AUTO_NEXT_KEY].newValue === true;
      settingsLoaded = true;
    }
  });

  loadSettings();
  observePlayer();
  findAndBindVideo();

  window.setInterval(() => {
    schedulePositionRepair();
    mountCustomModalForFullscreen();
    findAndBindVideo();
  }, SKIP_EVENT_REFRESH_MS);

  schedulePositionRepair();
  mountCustomModalForFullscreen();
})();
