(() => {
  const STORAGE_KEY = 'betterCrunchyrollEnabled';
  const STYLE_ID = 'better-crunchyroll-v221-style';
  const LIST_ATTR = 'data-better-crunchyroll-v221-list';
  const LIST_CONTENT_ATTR = 'data-better-crunchyroll-v221-list-content';
  const ITEM_ATTR = 'data-better-crunchyroll-v221-item';
  const WATCHED_ATTR = 'data-better-crunchyroll-v221-watched';
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
      /* v2.21 intentionally leaves the v2.20/v2.18 player-button CSS intact. */

      /* Keep Dub | Sub visible when the native episode card is hovered. */
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover [class*="footer-meta"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover [class*="meta-tags"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover [class*="tag-wrapper"] {
        opacity: 1 !important;
        visibility: visible !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover .playable-card__footer,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover .playable-card__footer-meta,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card:hover .meta-tags {
        opacity: 1 !important;
        visibility: visible !important;
      }

      /* Compact gray scrollbar for the episode-list scroll area. */
      .erc-episode-list-modal .scrollable-section,
      .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content {
        scrollbar-width: thin !important;
        scrollbar-color: #666 #242424 !important;
      }

      .erc-episode-list-modal .scrollable-section::-webkit-scrollbar,
      .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content::-webkit-scrollbar {
        width: 8px !important;
      }

      .erc-episode-list-modal .scrollable-section::-webkit-scrollbar-track,
      .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content::-webkit-scrollbar-track {
        background: #242424 !important;
      }

      .erc-episode-list-modal .scrollable-section::-webkit-scrollbar-thumb,
      .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content::-webkit-scrollbar-thumb {
        background: #666 !important;
        border-radius: 999px !important;
        border: 2px solid #242424 !important;
      }

      .erc-episode-list-modal .scrollable-section::-webkit-scrollbar-thumb:hover,
      .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content::-webkit-scrollbar-thumb:hover {
        background: #777 !important;
      }

      /* Preserve the v2.20 CSS-only conversion of the real native collection. */
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

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="body"] {
        min-width: 0 !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="footer-meta"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="meta-tags"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card [class*="tag-wrapper"] {
        opacity: 1 !important;
        visibility: visible !important;
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

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function isVisible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function currentWatchPath() {
    return location.pathname.replace(/\/+$/, '');
  }

  function getCurrentEpisodeCard(collection) {
    const path = currentWatchPath();
    const cards = Array.from(collection.children).filter((el) => el instanceof HTMLElement && el.matches('.card'));

    return cards.find((card) => Array.from(card.querySelectorAll('a[href*="/watch/"]')).some((a) => {
      try {
        return new URL(a.href, location.origin).pathname.replace(/\/+$/, '') === path;
      } catch {
        return false;
      }
    })) || cards.find((card) => /NOW PLAYING/i.test(card.textContent || '')) || null;
  }

  function centerCurrentEpisode(collection) {
    if (!collection || !isVisible(collection)) return;

    const current = getCurrentEpisodeCard(collection);
    if (!current || current === lastTarget) return;

    collection.querySelectorAll('[data-better-crunchyroll-v221-current="true"]').forEach((card) => {
      card.removeAttribute('data-better-crunchyroll-v221-current');
    });
    current.setAttribute('data-better-crunchyroll-v221-current', 'true');
    lastTarget = current;

    const scroller = collection.closest('.scrollable-section') || collection.parentElement?.closest('.scrollable-section');
    if (!scroller) {
      current.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      return;
    }

    const sr = scroller.getBoundingClientRect();
    const cr = current.getBoundingClientRect();
    const delta = (cr.top + cr.height / 2) - (sr.top + sr.height / 2);
    scroller.scrollTop += delta;
  }

  function styleEpisodeList() {
    if (!isEnabled()) return;

    const collections = Array.from(
      document.querySelectorAll('.erc-episode-list-modal .erc-playable-collection.state-dt-condensed')
    ).filter(isVisible);

    for (const collection of collections) {
      injectStyles();
      collection.setAttribute(LIST_ATTR, 'true');
      collection.style.setProperty('display', 'flex', 'important');
      collection.style.setProperty('flex-direction', 'column', 'important');
      collection.style.setProperty('flex-wrap', 'nowrap', 'important');
      collection.style.setProperty('align-items', 'stretch', 'important');
      collection.style.setProperty('gap', '12px', 'important');
      collection.style.setProperty('width', '100%', 'important');
      collection.style.setProperty('min-width', '0', 'important');
      centerCurrentEpisode(collection);
    }
  }

  function updateEpisodeTitleLayout() {
    if (!isEnabled()) return;

    const title = document.getElementById('better-crunchyroll-episode-title');
    if (!title) return;

    const autoHide = title.parentElement;
    if (!autoHide) return;

    const left = autoHide.querySelector('[data-testid="bottom-left-controls-stack"]');
    const right = autoHide.querySelector('[data-testid="bottom-right-controls-stack"]');
    const parentRect = autoHide.getBoundingClientRect();
    if (!left || !right || parentRect.width <= 0) return;

    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const available = rightRect.left - leftRect.right;
    const center = ((leftRect.right + rightRect.left) / 2) - parentRect.left;

    if (available < 220) {
      title.style.setProperty('display', 'none', 'important');
      return;
    }

    title.style.setProperty('display', 'block', 'important');
    title.style.setProperty('left', `${center}px`, 'important');
    title.style.setProperty('max-width', `${Math.max(0, available - 32)}px`, 'important');
    title.style.setProperty('transform', 'translateX(-50%)', 'important');
  }

  function removeEnhancementEffects() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    removeStyles();

    document.querySelectorAll(`[${LIST_ATTR}="true"]`).forEach((el) => el.removeAttribute(LIST_ATTR));
    document.querySelectorAll(`[${LIST_CONTENT_ATTR}="true"]`).forEach((el) => el.removeAttribute(LIST_CONTENT_ATTR));
    document.querySelectorAll(`[${ITEM_ATTR}="true"]`).forEach((el) => el.removeAttribute(ITEM_ATTR));
    document.querySelectorAll(`[${WATCHED_ATTR}="true"]`).forEach((el) => el.removeAttribute(WATCHED_ATTR));
    document.querySelectorAll(`[${DISCOVER_MOVED_ATTR}="true"]`).forEach((el) => el.removeAttribute(DISCOVER_MOVED_ATTR));
    document.querySelectorAll('.erc-episode-list-modal .erc-playable-collection.state-dt-condensed').forEach((el) => {
      for (const prop of ['display', 'flex-direction', 'flex-wrap', 'align-items', 'gap', 'width', 'min-width']) {
        el.style.removeProperty(prop);
      }
      el.querySelectorAll('[data-better-crunchyroll-v221-current="true"]').forEach((card) => {
        card.removeAttribute('data-better-crunchyroll-v221-current');
      });
    });

    document.getElementById(OVERLAY_ID)?.remove();
    lastTarget = null;
  }

  function setEnabled(next) {
    enabled = next !== false;

    if (!enabled) {
      removeEnhancementEffects();
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
    if (!video || video.__betterCrunchyroll221LoadingHook) return;
    video.__betterCrunchyroll221LoadingHook = true;
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
    updateEpisodeTitleLayout();
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
    window.addEventListener('resize', updateEpisodeTitleLayout, { passive: true });
    document.addEventListener('fullscreenchange', updateEpisodeTitleLayout);
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
