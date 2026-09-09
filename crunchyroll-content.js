(() => {
  const STORAGE_KEY = 'betterCrunchyrollEnabled';
  const STYLE_ID = 'better-crunchyroll-style';
  const OVERLAY_ID = 'better-crunchyroll-loading';
  const BACK_BUTTON_ID = 'better-crunchyroll-back';
  const ROOT_ATTR = 'data-better-crunchyroll-root';
  const HIDDEN_ATTR = 'data-better-crunchyroll-hidden';
  const WATCH_ROUTE = /^\/watch(\/|$)/i;
  const BACK_HIDE_DELAY = 6000;
  const BACK_INITIAL_DELAY = 9000;
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
        position: fixed;
        top: 18px;
        left: 18px;
        z-index: 2147483647;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(17, 19, 24, 0.78);
        color: rgba(255, 255, 255, 0.94);
        cursor: pointer;
        backdrop-filter: blur(16px) saturate(120%);
        -webkit-backdrop-filter: blur(16px) saturate(120%);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
        opacity: 0.75;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-5px);
        transition:
          opacity 200ms linear,
          transform 220ms ease,
          visibility 0s linear 220ms,
          background 160ms ease;
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

    // The Back button stays unavailable until the current video has actually
    // started playback, then remains blocked for the full initial delay.
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
      // Listener is already attached to this exact video.
      if (!video.paused && !video.ended) {
        armBackButtonTimer(video);
      }
      return;
    }

    const onPlay = () => armBackButtonTimer(video);
    state.backVideoPlayHandler = onPlay;
    video.addEventListener('play', onPlay, { passive: true });

    // A video may already be playing by the time the listener is installed.
    if (!video.paused && !video.ended) {
      armBackButtonTimer(video);
    }
  }

  function cleanupBackButtonVideoTimer() {
    if (state.playerVideo && state.backVideoPlayHandler) {
      state.playerVideo.removeEventListener('play', state.backVideoPlayHandler);
    }

    state.backVideoPlayHandler = null;
    state.playerVideo = null;
    state.backTimerStartedForVideo = null;
    state.backAvailableAt = 0;
    clearBackInitialTimer();
    clearBackHideTimer();
  }

  function ensureBackButton() {
    let button = document.getElementById(BACK_BUTTON_ID);
    if (button) {
      return button;
    }

    button = document.createElement('button');
    button.id = BACK_BUTTON_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Back');

    const icon = document.createElement('img');
    icon.className = 'back-icon';
    icon.alt = '';
    icon.src = chrome.runtime.getURL('icons/back-button.svg');
    button.appendChild(icon);

    button.addEventListener('click', () => {
      if (state.backAvailableAt > performance.now()) {
        return;
      }
      history.pushState({}, '', '/discover');
      window.dispatchEvent(new Event('popstate'));
    });

    document.body.appendChild(button);
    return button;
  }

  function findPlayerShell() {
    return document.querySelector('[data-testid="player-container"]')
      || document.querySelector('#player-container')
      || document.querySelector('.video-player');
  }

  function findPlayerVideo(playerShell) {
    return playerShell?.querySelector('video') || document.querySelector('video');
  }

  function setPlayerRoot(playerShell) {
    if (!playerShell) {
      return;
    }

    if (state.playerShell && state.playerShell !== playerShell) {
      state.playerShell.removeAttribute(ROOT_ATTR);
    }

    playerShell.setAttribute(ROOT_ATTR, 'true');
    state.playerShell = playerShell;
  }

  function hidePageChrome() {
    const selectors = [
      'header.erc-large-header',
      'nav.header-nav',
      '[data-testid="header"]',
      '.app-layout__header--ywueY',
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.closest(`[${ROOT_ATTR}="true"]`)) {
          el.setAttribute(HIDDEN_ATTR, 'true');
        }
      });
    });
  }

  function restorePageChrome() {
    document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`).forEach((el) => {
      el.removeAttribute(HIDDEN_ATTR);
    });
  }

  function getEpisodeTitle() {
    const meta = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (meta) {
      const withoutShow = meta.replace(/\s*\|\s*E\d+\s*-\s*/i, ' — ');
      const parts = withoutShow.split(' — ');
      return parts.length > 1 ? parts.slice(1).join(' — ').trim() : withoutShow.trim();
    }

    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => {
        try { return JSON.parse(node.textContent || ''); } catch { return null; }
      })
      .find((data) => data && data['@type'] === 'TVEpisode');

    return jsonLd?.name?.replace(/^.*?\|\s*E\d+\s*-\s*/i, '').trim() || document.title.replace(/\s+-\s+Watch on Crunchyroll.*$/i, '').trim();
  }

  function ensureEpisodeTitle(container) {
    let title = container.querySelector(`#${EPISODE_TITLE_ID}`);
    if (!title) {
      title = document.createElement('div');
      title.id = EPISODE_TITLE_ID;
      title.setAttribute('aria-hidden', 'true');
      container.appendChild(title);
    }

    title.textContent = getEpisodeTitle();
  }

  function findEpisodeListHost() {
    return document.querySelector('[data-testid="bottom-right-controls-stack"]')
      || document.querySelector('[data-testid="bottom-controls-autohide"]')?.querySelector('[data-testid="bottom-right-controls-stack"]')
      || null;
  }

  function ensureEpisodeListButton() {
    const host = findEpisodeListHost();
    if (!host || host.querySelector(`#${EPISODE_LIST_BUTTON_ID}`)) {
      return;
    }

    const button = document.createElement('button');
    button.id = EPISODE_LIST_BUTTON_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'More Episodes');
    button.title = 'More Episodes';

    const img = document.createElement('img');
    img.className = 'better-crunchyroll-episode-list-icon';
    img.alt = '';
    img.src = chrome.runtime.getURL('icons/episodes.svg');
    button.appendChild(img);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const native = document.querySelector('[data-t="see-more-episodes-btn"]')
        || document.querySelector('[data-testid="see-more-episodes-btn"]');
      if (native instanceof HTMLElement) {
        native.click();
      }
    });

    host.appendChild(button);
  }

  function installActivityReveal() {
    if (state.activityHandlersInstalled) {
      return;
    }

    const handler = () => {
      showBackButton();
    };

    state.activityRevealHandler = handler;
    ['mousemove', 'pointermove', 'touchstart', 'keydown', 'wheel'].forEach((eventName) => {
      document.addEventListener(eventName, handler, { passive: true });
    });
    state.activityHandlersInstalled = true;
  }

  function removeActivityReveal() {
    if (!state.activityHandlersInstalled || !state.activityRevealHandler) {
      return;
    }

    ['mousemove', 'pointermove', 'touchstart', 'keydown', 'wheel'].forEach((eventName) => {
      document.removeEventListener(eventName, state.activityRevealHandler);
    });

    state.activityRevealHandler = null;
    state.activityHandlersInstalled = false;
  }

  function processPlayer() {
    if (!isWatchPage()) {
      return false;
    }

    const playerShell = findPlayerShell();
    const video = findPlayerVideo(playerShell);

    if (!playerShell || !video) {
      return false;
    }

    ensureStyle();
    ensureBackButton();
    setPlayerRoot(playerShell);
    hidePageChrome();

    if (state.playerVideo !== video) {
      if (state.playerVideo && state.backVideoPlayHandler) {
        state.playerVideo.removeEventListener('play', state.backVideoPlayHandler);
      }
      state.playerVideo = video;
      state.backVideoPlayHandler = null;
      state.backTimerStartedForVideo = null;
      state.backAvailableAt = 0;
      installBackButtonVideoTimer(video);
    } else {
      installBackButtonVideoTimer(video);
    }

    installActivityReveal();

    const controls = document.querySelector('[data-testid="bottom-controls-autohide"]');
    if (controls) {
      ensureEpisodeTitle(controls);
      ensureEpisodeListButton();
    }

    removeOverlay();
    return true;
  }

  function resetExtension() {
    clearBackInitialTimer();
    clearBackHideTimer();
    cleanupBackButtonVideoTimer();
    removeActivityReveal();
    document.getElementById(BACK_BUTTON_ID)?.remove();
    document.getElementById(EPISODE_TITLE_ID)?.remove();
    document.getElementById(EPISODE_LIST_BUTTON_ID)?.remove();
    if (state.playerShell) {
      state.playerShell.removeAttribute(ROOT_ATTR);
    }
    state.playerShell = null;
    restorePageChrome();
    removeStyle();
    removeOverlay();
  }

  function apply() {
    if (!state.enabled || !isWatchPage()) {
      resetExtension();
      return;
    }

    if (state.applying) {
      return;
    }

    state.applying = true;
    try {
      if (!processPlayer()) {
        ensureStyle();
        ensureOverlay();
      }
    } finally {
      state.applying = false;
    }
  }

  function startObserver() {
    if (state.observer) {
      state.observer.disconnect();
    }

    state.observer = new MutationObserver(() => {
      if (!state.applying) {
        apply();
      }
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-testid'],
    });
  }

  function startRouteWatcher() {
    if (state.routeTimer) {
      window.clearInterval(state.routeTimer);
    }

    state.routeTimer = window.setInterval(() => {
      if (location.href !== state.lastHref) {
        state.lastHref = location.href;
        resetExtension();
        apply();
      }
    }, 500);
  }

  async function loadEnabledState() {
    const stored = await chrome.storage.local.get({ [STORAGE_KEY]: true });
    state.enabled = stored[STORAGE_KEY] !== false;
    apply();
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) {
      return;
    }

    state.enabled = changes[STORAGE_KEY].newValue !== false;
    apply();
  });

  window.addEventListener('better-crunchyroll-locationchange', () => {
    state.lastHref = location.href;
    resetExtension();
    apply();
  });

  startObserver();
  startRouteWatcher();
  loadEnabledState();
})();
