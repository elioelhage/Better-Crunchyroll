(() => {
  const STORAGE_KEY = 'betterCrunchyrollEnabled';
  const STYLE_ID = 'better-crunchyroll-v220-style';
  const LIST_ATTR = 'data-better-crunchyroll-v220-list';
  const LIST_CONTENT_ATTR = 'data-better-crunchyroll-v220-list-content';
  const ITEM_ATTR = 'data-better-crunchyroll-v220-item';
  const WATCHED_ATTR = 'data-better-crunchyroll-v220-watched';
  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const OVERLAY_ID = 'better-crunchyroll-loading';
  const HIDDEN_ATTR = 'data-better-crunchyroll-hidden';
  const DISCOVER_MOVED_ATTR = 'data-better-crunchyroll-discover-moved';

  let enabled = true;
  let observer = null;
  let refreshTimer = null;
  let lastTarget = null;

  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function isEnabled() {
    return enabled;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* v2.20: episode-list-only layout change. All existing v2.18 player
         and button rules remain untouched because this file does not style
         or reposition any player-control buttons. */
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        flex-wrap: nowrap !important;
        gap: 12px !important;
        width: 100% !important;
        min-width: 0 !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card > [class*="playable-card--"] {
        display: grid !important;
        grid-template-columns: 180px minmax(0, 1fr) !important;
        align-items: center !important;
        column-gap: 16px !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="thumbnail-wrapper"] {
        grid-column: 1 !important;
        grid-row: 1 !important;
        width: 180px !important;
        max-width: 180px !important;
        min-width: 180px !important;
        margin: 0 !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="thumbnail-wrapper"] img {
        display: block !important;
        width: 180px !important;
        height: 101px !important;
        max-width: 180px !important;
        max-height: 101px !important;
        object-fit: cover !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="body-aligner"] {
        grid-column: 2 !important;
        grid-row: 1 !important;
        width: auto !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="hover-info"] {
        display: none !important;
      }

      @media (max-width: 700px) {
        .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card > [class*="playable-card--"] {
          grid-template-columns: 140px minmax(0, 1fr) !important;
          column-gap: 12px !important;
        }

        .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="thumbnail-wrapper"] {
          width: 140px !important;
          max-width: 140px !important;
          min-width: 140px !important;
        }

        .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="thumbnail-wrapper"] img {
          width: 140px !important;
          height: 79px !important;
          max-width: 140px !important;
          max-height: 79px !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function styleEpisodeList() {
    if (!isEnabled()) return;

    // v2.20 deliberately performs no DOM moves, sorting, cloning, or
    // reparenting. It only changes the CSS layout of the real native episode
    // collection named by the user: .erc-playable-collection.state-dt-condensed
    // inside .erc-episode-list-modal.
    const collections = Array.from(document.querySelectorAll(
      '.erc-episode-list-modal .erc-playable-collection.state-dt-condensed'
    )).filter((element) => {
      const computed = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return computed.display !== 'none'
        && computed.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0;
    });

    if (!collections.length) return;
    injectStyles();
  }

  function removeV220Effects() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    removeStyle();
    document.querySelectorAll(`[${LIST_ATTR}="true"], [${LIST_CONTENT_ATTR}="true"], [${ITEM_ATTR}="true"], [${WATCHED_ATTR}="true"]`).forEach((element) => {
      element.removeAttribute(LIST_ATTR);
      element.removeAttribute(LIST_CONTENT_ATTR);
      element.removeAttribute(ITEM_ATTR);
      element.removeAttribute(WATCHED_ATTR);
    });
    lastTarget = null;
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) {
      removeV220Effects();
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      return;
    }

    injectStyles();
    if (!observer) {
      observer = new MutationObserver(() => refreshPageEnhancements());
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    refreshPageEnhancements();
  }

  function removeStuckLoadingOverlay() {
    if (!isEnabled()) return;
    const overlay = document.getElementById(OVERLAY_ID);
    const video = document.querySelector('video');
    if (!overlay || !video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || !video.paused || video.ended) {
      overlay.remove();
    }
  }

  function watchVideoLoading() {
    if (!isEnabled()) return;
    const video = document.querySelector('video');
    if (!video || video.__betterCrunchyroll217LoadingHook) return;
    video.__betterCrunchyroll217LoadingHook = true;
    const finish = () => removeStuckLoadingOverlay();
    for (const event of ['loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'timeupdate', 'durationchange']) {
      video.addEventListener(event, finish, { passive: true });
    }
    finish();
  }

  function isDiscoverPage() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path === '/discover' || path === '/home';
  }

  function findDiscoverFeed(title) {
    const wanted = normalize(title);
    const heading = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'))
      .find((element) => normalize(element.textContent) === wanted);
    if (!heading) return null;
    return heading.closest('[data-id]') || heading.closest('section') || heading.parentElement;
  }

  function moveContinueWatching() {
    if (!isEnabled() || !isDiscoverPage()) return;
    const continueWatching = findDiscoverFeed('Continue Watching');
    const trending = findDiscoverFeed('Trending in Canada');
    if (!continueWatching || !trending || continueWatching === trending) return;
    const parent = trending.parentElement;
    if (!parent) return;
    if (continueWatching.parentElement === parent && continueWatching.previousElementSibling === trending) {
      continueWatching.setAttribute(DISCOVER_MOVED_ATTR, 'true');
      return;
    }
    parent.insertBefore(continueWatching, trending.nextSibling);
    continueWatching.setAttribute(DISCOVER_MOVED_ATTR, 'true');
  }

  function refreshPageEnhancements() {
    if (!isEnabled()) return;
    watchVideoLoading();
    removeStuckLoadingOverlay();
    moveContinueWatching();
    styleEpisodeList();
  }

  function startButtonHook() {
    document.addEventListener('click', (event) => {
      if (!isEnabled()) return;
      const button = event.target?.closest?.(`#${EPISODE_BUTTON_ID}`);
      if (button) {
        lastTarget = null;
        for (const delay of [0, 50, 120, 250, 500, 900, 1500]) {
          setTimeout(refreshPageEnhancements, delay);
        }
      }
    }, true);

    window.addEventListener('better-crunchyroll-locationchange', refreshPageEnhancements);
    window.addEventListener('popstate', refreshPageEnhancements);
    window.addEventListener('hashchange', refreshPageEnhancements);
  }

  chrome.storage.local.get({ [STORAGE_KEY]: true }, (result) => {
    setEnabled(result[STORAGE_KEY] !== false);
    refreshPageEnhancements();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      setEnabled(changes[STORAGE_KEY].newValue !== false);
      if (enabled) refreshPageEnhancements();
    }
  });

  startButtonHook();
})();
