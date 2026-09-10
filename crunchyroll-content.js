(() => {
  const STORAGE_KEY = 'betterCrunchyrollEnabled';
  const STYLE_ID = 'better-crunchyroll-style';
  const OVERLAY_ID = 'better-crunchyroll-loading';
  const BACK_BUTTON_ID = 'better-crunchyroll-back';
  const ROOT_ATTR = 'data-better-crunchyroll-root';
  const HIDDEN_ATTR = 'data-better-crunchyroll-hidden';
  const WATCH_ROUTE = /^\/watch(\/|$)/i;
  const BACK_HIDE_DELAY = 6000;
  const BACK_INITIAL_DELAY = 6500;
  const BACK_VISIBLE_CLASS = 'better-crunchyroll-back-visible';
  const EPISODE_TITLE_ID = 'better-crunchyroll-episode-title';
  const EPISODE_LIST_BUTTON_ID = 'better-crunchyroll-episode-list';

  const state = {
    enabled: true,
    observer: null,
    routeTimer: null,
    lastHref: location.href,
    applied: false,
    applying: false,
    backHideTimer: null,
    backInitialTimer: null,
    backAvailableAt: 0,
    backTimerStartedForVideo: null,
    backVideoPlayHandler: null,
    playerShell: null,
    playerVideo: null,
    activityHandlersInstalled: false,
    activityRevealHandler: null,
  };

  if (!window.__betterCrunchyrollRouteHooksInstalled) {
    window.__betterCrunchyrollRouteHooksInstalled = true;

    const notifyRouteChange = () => {
      window.dispatchEvent(new Event('better-crunchyroll-locationchange'));
    };

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      notifyRouteChange();
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      notifyRouteChange();
      return result;
    };

    window.addEventListener('popstate', notifyRouteChange);
    window.addEventListener('hashchange', notifyRouteChange);
  }

  function isWatchPage() {
    return WATCH_ROUTE.test(location.pathname);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html, body {
        margin: 0 !important;
        background: #000 !important;
      }

      body {
        overflow: hidden !important;
      }

      [${ROOT_ATTR}="true"] {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        overflow: hidden !important;
        background: #000 !important;
        z-index: 2147483644 !important;
      }

      [${ROOT_ATTR}="true"] video {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        background: #000 !important;
      }

      [${HIDDEN_ATTR}="true"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        background: #000;
        z-index: 2147483647;
      }

      #${OVERLAY_ID}::before {
        content: '';
        width: 54px;
        height: 54px;
        border-radius: 50%;
        border: 4px solid rgba(255, 255, 255, 0.12);
        border-top-color: #ff7300;
        animation: betterCrunchyrollSpin 900ms linear infinite;
      }

      @keyframes betterCrunchyrollSpin {
        to {
          transform: rotate(360deg);
        }
      }

      #${BACK_BUTTON_ID} {
        position: absolute;
        top: 18px;
        left: 18px;
        z-index: 2147483647;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 999px;
        background: transparent;
        color: rgba(255, 255, 255, 0.94);
        cursor: pointer;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        box-shadow: none;
        opacity: 0.75;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-5px);
        transition:
          opacity 200ms linear,
          transform 220ms ease,
          visibility 0s linear 220ms,
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      #${BACK_BUTTON_ID}.${BACK_VISIBLE_CLASS} {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(0);
        transition-delay: 0s;
      }

      #${BACK_BUTTON_ID}:hover,
      #${BACK_BUTTON_ID}:focus-visible {
        opacity: 1;
        background: #3f3f46;
        border-color: transparent;
        box-shadow: none;
      }

      #${BACK_BUTTON_ID} .back-icon {
        width: 17px;
        height: 17px;
        flex: 0 0 auto;
        display: block;
        filter: brightness(0) invert(1);
        opacity: 1;
      }

      [data-testid="bottom-controls-autohide"] {
        position: relative !important;
      }

      #${EPISODE_TITLE_ID} {
        position: absolute;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        max-width: min(46vw, 720px);
        padding: 0 12px;
        color: #f5f5f5;
        font-family: inherit;
        font-size: clamp(14px, 1.15vw, 22px);
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
        user-select: none;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
        z-index: 2;
      }

      #${EPISODE_LIST_BUTTON_ID} {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        margin: 0;
        padding: 6px;
        border: 4px solid transparent;
        border-radius: 999px;
        background: transparent;
        color: #bbbbbb;
        cursor: pointer;
        opacity: 0.75;
        transition: opacity 200ms linear, background 160ms ease, transform 120ms ease;
        box-sizing: border-box;
      }

      #${EPISODE_LIST_BUTTON_ID}:hover,
      #${EPISODE_LIST_BUTTON_ID}:focus-visible {
        opacity: 1;
        background: #3f3f46;
      }

      #${EPISODE_LIST_BUTTON_ID}:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.9);
        outline-offset: 1px;
      }

      .better-crunchyroll-episode-list-icon {
        width: 24px;
        height: 24px;
        display: block;
        flex: 0 0 auto;
        opacity: 1;
      }

      @media (min-width: 1024px) {
        #${EPISODE_LIST_BUTTON_ID} {
          width: 44px;
          height: 44px;
        }

        .better-crunchyroll-episode-list-icon {
          width: 24px;
          height: 24px;
        }

        #${EPISODE_TITLE_ID} {
          bottom: 24px;
          font-size: clamp(16px, 1.15vw, 24px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${BACK_BUTTON_ID} {
          transition: none;
        }
      }
    `;

    document.documentElement.appendChild(style);
  }

  function removeStyle() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function ensureOverlay() {
    if (document.getElementById(OVERLAY_ID)) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    document.documentElement.appendChild(overlay);
  }

  function removeOverlay() {
    document.getElementById(OVERLAY_ID)?.remove();
  }

  function clearBackHideTimer() {
    if (state.backHideTimer) {
      window.clearTimeout(state.backHideTimer);
      state.backHideTimer = null;
    }
  }

  function clearBackInitialTimer() {
    if (state.backInitialTimer) {
      window.clearTimeout(state.backInitialTimer);
      state.backInitialTimer = null;
    }
  }

  function showBackButton() {
    const button = document.getElementById(BACK_BUTTON_ID);
    if (!button) {
      return;
    }

    const remaining = state.backAvailableAt > 0
      ? state.backAvailableAt - performance.now()
      : Infinity;

    if (remaining > 0) {
      button.classList.remove(BACK_VISIBLE_CLASS);
      clearBackInitialTimer();
      if (Number.isFinite(remaining)) {
        state.backInitialTimer = window.setTimeout(() => {
          state.backInitialTimer = null;
          showBackButton();
        }, remaining);
      }
      return;
    }

    button.classList.add(BACK_VISIBLE_CLASS);
    clearBackHideTimer();
    state.backHideTimer = window.setTimeout(() => {
      button.classList.remove(BACK_VISIBLE_CLASS);
      state.backHideTimer = null;
    }, BACK_HIDE_DELAY);
  }

  function armBackButtonTimer(video) {
    if (!video || state.backTimerStartedForVideo === video) {
      return;
    }

    state.backTimerStartedForVideo = video;
    state.backAvailableAt = performance.now() + BACK_INITIAL_DELAY;
    clearBackInitialTimer();
    clearBackHideTimer();
    showBackButton();
  }

  function installBackButtonVideoTimer(video) {
    if (!video) {
      return;
    }

    if (state.playerVideo !== video && state.backVideoPlayHandler) {
      state.playerVideo?.removeEventListener('play', state.backVideoPlayHandler);
      state.backVideoPlayHandler = null;
    }

    if (state.backVideoPlayHandler) {
      if (!video.paused && !video.ended) {
        armBackButtonTimer(video);
      }
      return;
    }

    const onPlay = () => armBackButtonTimer(video);
    state.backVideoPlayHandler = onPlay;
    video.addEventListener('play', onPlay, { passive: true });

    if (!video.paused && !video.ended) {
      armBackButtonTimer(video);
    }
  }

  function installBackButtonActivity(shell) {
    if (!shell) {
      return;
    }

    if (state.activityHandlersInstalled && state.playerShell === shell) {
      showBackButton();
      return;
    }

    uninstallBackButtonActivity();

    const reveal = () => showBackButton();
    state.playerShell = shell;
    state.activityRevealHandler = reveal;
    state.activityHandlersInstalled = true;

    shell.addEventListener('pointermove', reveal, { passive: true });
    shell.addEventListener('pointerdown', reveal, { passive: true });
    shell.addEventListener('touchstart', reveal, { passive: true });
    document.addEventListener('keydown', reveal, { passive: true });
    showBackButton();
  }

  function uninstallBackButtonActivity() {
    clearBackHideTimer();
    clearBackInitialTimer();

    if (state.playerShell && state.activityRevealHandler) {
      state.playerShell.removeEventListener('pointermove', state.activityRevealHandler);
      state.playerShell.removeEventListener('pointerdown', state.activityRevealHandler);
      state.playerShell.removeEventListener('touchstart', state.activityRevealHandler);
    }

    if (state.activityRevealHandler) {
      document.removeEventListener('keydown', state.activityRevealHandler);
    }

    if (state.playerVideo && state.backVideoPlayHandler) {
      state.playerVideo.removeEventListener('play', state.backVideoPlayHandler);
    }

    state.playerShell = null;
    state.playerVideo = null;
    state.backAvailableAt = 0;
    state.backTimerStartedForVideo = null;
    state.backVideoPlayHandler = null;
    state.activityRevealHandler = null;
    state.activityHandlersInstalled = false;
  }

  function ensureBackButton(shell) {
    const video = shell?.querySelector?.('video') || document.querySelector('video');
    const isNewVideo = state.playerShell !== shell || state.playerVideo !== video;

    if (isNewVideo) {
      if (state.playerVideo && state.backVideoPlayHandler) {
        state.playerVideo.removeEventListener('play', state.backVideoPlayHandler);
      }
      state.backVideoPlayHandler = null;
      state.backAvailableAt = 0;
      state.backTimerStartedForVideo = null;
      clearBackInitialTimer();
      clearBackHideTimer();
    }

    let button = document.getElementById(BACK_BUTTON_ID);

    if (!button) {
      button = document.createElement('button');
      button.id = BACK_BUTTON_ID;
      button.type = 'button';
      button.setAttribute('aria-label', 'Back to Crunchyroll home');
      button.innerHTML = `
        <img class="back-icon" src="${chrome.runtime.getURL('icons/back-button.svg')}" alt="" aria-hidden="true">
      `;
      button.addEventListener('click', () => {
        window.location.href = 'https://www.crunchyroll.com/';
      });
      document.documentElement.appendChild(button);
    }

    state.playerVideo = video;

    // Keep the custom Back button inside the player shell so it remains part
    // of the fullscreen surface instead of disappearing with document chrome.
    if (shell && button.parentElement !== shell) {
      shell.appendChild(button);
    }

    installBackButtonVideoTimer(video);
    installBackButtonActivity(shell);
    showBackButton();
  }

  function removeBackButton() {
    uninstallBackButtonActivity();
    document.getElementById(BACK_BUTTON_ID)?.remove();
  }

  function clearMarkers() {
    document.querySelectorAll(`[${ROOT_ATTR}="true"]`).forEach((element) => {
      element.removeAttribute(ROOT_ATTR);
    });

    document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`).forEach((element) => {
      element.removeAttribute(HIDDEN_ATTR);
    });
  }

  function getEpisodeTitle() {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (ogTitle) {
      const separator = ogTitle.indexOf(' | ');
      return separator >= 0 ? ogTitle.slice(separator + 3).trim() : ogTitle;
    }

    const title = document.title.replace(/\s*-\s*Watch on Crunchyroll\s*$/i, '').trim();
    return title || 'Crunchyroll';
  }

  function findEpisodeListTrigger() {
    return document.querySelector('[data-t="see-more-episodes-btn"]')
      || document.querySelector('button.see-all-button')
      || null;
  }

  function openEpisodeList() {
    const trigger = findEpisodeListTrigger();
    if (!trigger) {
      return;
    }

    const wasHidden = trigger.getAttribute(HIDDEN_ATTR) === 'true';
    if (wasHidden) {
      trigger.removeAttribute(HIDDEN_ATTR);
    }

    try {
      trigger.click();
    } finally {
      if (wasHidden) {
        window.setTimeout(() => trigger.setAttribute(HIDDEN_ATTR, 'true'), 0);
      }
    }
  }

  function ensureEpisodeControls() {
    const autoHide = document.querySelector('[data-testid="bottom-controls-autohide"]');
    if (!autoHide) {
      return;
    }

    let title = autoHide.querySelector(`#${EPISODE_TITLE_ID}`);
    const episodeTitle = getEpisodeTitle();
    if (!title) {
      title = document.createElement('div');
      title.id = EPISODE_TITLE_ID;
      title.className = 'better-crunchyroll-episode-title';
      title.setAttribute('aria-hidden', 'true');
      autoHide.appendChild(title);
    }
    if (title.textContent !== episodeTitle) {
      title.textContent = episodeTitle;
    }

    const rightStack = autoHide.querySelector('[data-testid="bottom-right-controls-stack"]');
    if (!rightStack) {
      return;
    }

    let button = rightStack.querySelector(`#${EPISODE_LIST_BUTTON_ID}`);
    if (!button) {
      button = document.createElement('button');
      button.id = EPISODE_LIST_BUTTON_ID;
      button.type = 'button';
      button.setAttribute('aria-label', 'Episodes');
      button.title = 'Episodes';
      button.className = 'better-crunchyroll-episode-list-button';
      button.innerHTML = `
        <img class="better-crunchyroll-episode-list-icon" src="${chrome.runtime.getURL('icons/episodes.svg')}" alt="" aria-hidden="true">
      `;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openEpisodeList();
      });
    }

    const nextEpisode = rightStack.querySelector('[data-testid="next-episode-button"]');
    const nextWrapper = nextEpisode?.parentElement;

    if (nextWrapper && nextWrapper.parentElement === rightStack) {
      if (button.parentElement !== rightStack || nextWrapper.nextElementSibling !== button) {
        nextWrapper.insertAdjacentElement('afterend', button);
      }
    } else if (button.parentElement !== rightStack) {
      rightStack.appendChild(button);
    }
  }

  function manageEpisodeControls() {
    const nextSelectors = [
      'button[aria-label="Next Episode"]',
      'a[aria-label="Next Episode"]',
      'button[title="Next Episode"]',
      'a[title="Next Episode"]',
      'button[data-testid="next-episode"]',
      'a[data-testid="next-episode"]',
    ];

    for (const selector of nextSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        element.removeAttribute(HIDDEN_ATTR);
      }
    }

    const previousSelectors = [
      'button[aria-label="Previous Episode"]',
      'a[aria-label="Previous Episode"]',
      'button[title="Previous Episode"]',
      'a[title="Previous Episode"]',
      'button[data-testid="previous-episode"]',
      'a[data-testid="previous-episode"]',
    ];

    for (const selector of previousSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        element.setAttribute(HIDDEN_ATTR, 'true');
      }
    }
  }

  function locatePlayerShell() {
    const video = document.querySelector('video');
    if (!video) {
      return null;
    }

    const playerContainer = document.querySelector('#player-container');
    if (playerContainer?.contains(video)) {
      return playerContainer;
    }

    const labeledPlayer = document.querySelector('[aria-label="Video Player"]');
    if (labeledPlayer?.contains(video)) {
      return labeledPlayer;
    }

    const controlRoot = document.querySelector('[data-testid="player-controls-root"]');
    if (controlRoot) {
      let controlShell = controlRoot.parentElement;
      while (controlShell && controlShell !== document.body) {
        if (controlShell.contains(video)) {
          return controlShell;
        }
        controlShell = controlShell.parentElement;
      }
    }

    let fallback = video.parentElement;
    let current = video.parentElement;

    while (current && current !== document.body) {
      const label = [
        current.id,
        current.className,
        current.getAttribute('data-testid'),
        current.getAttribute('aria-label'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (label.includes('player') || label.includes('video') || label.includes('watch')) {
        return current;
      }

      const rect = current.getBoundingClientRect();
      if (!fallback && rect.width >= 320 && rect.height >= 180) {
        fallback = current;
      }

      current = current.parentElement;
    }

    return fallback;
  }

  function hideAncestorChrome(shell) {
    const selectors = [
      'header',
      'nav',
      'aside',
      '[role="navigation"]',
      '[aria-label*="recommend" i]',
      '[aria-label*="description" i]',
      '[aria-label*="details" i]',
      '[data-testid*="recommend" i]',
      '[data-testid*="description" i]',
      '[data-testid*="details" i]',
      '[class*="recommend" i]',
      '[class*="description" i]',
      '[class*="details" i]',
      '[class*="metadata" i]',
      '[class*="episode" i]',
    ];

    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (!element.contains(shell) && !shell.contains(element)) {
          element.setAttribute(HIDDEN_ATTR, 'true');
        }
      }
    }
  }

  function startObserver() {
    if (state.observer) {
      return;
    }

    state.observer = new MutationObserver(() => {
      if (state.applying) {
        return;
      }

      if (!state.enabled || !isWatchPage()) {
        cleanup();
        return;
      }

      if (!state.applied || !document.querySelector(`[${ROOT_ATTR}="true"]`)) {
        applyWatchMode();
        return;
      }

      manageEpisodeControls();
      ensureEpisodeControls();
      const shell = locatePlayerShell();
      if (shell) {
        ensureBackButton(shell);
      }
      removeOverlay();
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserver() {
    state.observer?.disconnect();
    state.observer = null;
  }

  function applyWatchMode() {
    if (state.applying) {
      return;
    }

    if (state.applied && document.querySelector(`[${ROOT_ATTR}="true"]`)) {
      manageEpisodeControls();
      ensureEpisodeControls();
      removeOverlay();
      startObserver();
      return;
    }

    state.applying = true;

    try {
      ensureStyle();
      ensureOverlay();

      const shell = locatePlayerShell();
      if (!shell) {
        state.applied = false;
        startObserver();
        return;
      }

      shell.setAttribute(ROOT_ATTR, 'true');
      hideAncestorChrome(shell);
      manageEpisodeControls();
      ensureEpisodeControls();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          removeOverlay();
          ensureBackButton(shell);
        });
      });
      state.applied = true;
      startObserver();
    } finally {
      state.applying = false;
    }
  }

  function cleanup() {
    state.applied = false;
    state.applying = false;
    stopObserver();
    removeStyle();
    removeOverlay();
    removeBackButton();
    clearMarkers();
  }

  function refresh() {
    if (!state.enabled || !isWatchPage()) {
      cleanup();
      return;
    }

    applyWatchMode();
  }

  function syncRoute() {
    if (location.href === state.lastHref) {
      return;
    }

    state.lastHref = location.href;
    refresh();
  }

  function installRoutePolling() {
    if (state.routeTimer) {
      return;
    }

    state.routeTimer = window.setInterval(syncRoute, 250);
  }

  chrome.storage.local.get({ [STORAGE_KEY]: true }, (result) => {
    state.enabled = result[STORAGE_KEY] !== false;
    refresh();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      state.enabled = changes[STORAGE_KEY].newValue !== false;
      refresh();
    }
  });

  window.addEventListener('better-crunchyroll-locationchange', refresh);
  document.addEventListener('fullscreenchange', () => {
    if (!state.enabled || !isWatchPage()) return;
    const shell = locatePlayerShell();
    if (shell) {
      ensureBackButton(shell);
    }
  });
  installRoutePolling();
})();
