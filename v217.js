(() => {
  const STORAGE_KEY = 'betterCrunchyrollEnabled';
  const STYLE_ID = 'better-crunchyroll-v217-style';
  const LIST_ATTR = 'data-better-crunchyroll-v217-list';
  const LIST_CONTENT_ATTR = 'data-better-crunchyroll-v217-list-content';
  const ITEM_ATTR = 'data-better-crunchyroll-v217-item';
  const WATCHED_ATTR = 'data-better-crunchyroll-v217-watched';
  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const OVERLAY_ID = 'better-crunchyroll-loading';
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
      #better-crunchyroll-back .back-icon {
        transform: translateX(-2px) !important;
      }

      #better-crunchyroll-back {
        background: transparent !important;
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      #better-crunchyroll-back:hover,
      #better-crunchyroll-back:focus-visible {
        background: #3f3f46 !important;
        background-color: #3f3f46 !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      #better-crunchyroll-episode-title {
        bottom: 13px !important;
      }

      @media (min-width: 1024px) {
        #better-crunchyroll-episode-title {
          bottom: 21px !important;
        }
      }

      /* Target the actual visible native episode list rather than the separate
         page-level .videos wrapper. Depending on the current Crunchyroll DOM,
         this is either .episode-list itself or its inner .list-content node. */
      [${LIST_CONTENT_ATTR}="true"] {
        display: flex !important;
        flex-direction: column !important;
        flex-wrap: nowrap !important;
        gap: 12px !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] {
        display: flex !important;
        flex: 0 0 auto !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 16px !important;
        width: 100% !important;
        min-width: 0 !important;
        min-height: 96px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] .playable-card-mini-static {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 16px !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] .playable-card-mini-static__thumbnail-wrapper--kGEEH,
      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] {
        flex: 0 0 180px !important;
        width: 180px !important;
        min-width: 180px !important;
        max-width: 180px !important;
        margin: 0 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] img {
        display: block !important;
        width: 180px !important;
        height: 101px !important;
        max-width: 180px !important;
        max-height: 101px !important;
        object-fit: cover !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] .playable-card-mini-static__body-aligner--wTXAJ,
      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="body-aligner"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] .playable-card-mini-static__body--odiBS,
      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="body--"] {
        width: 100% !important;
        min-width: 0 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] h3,
      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="title"] {
        margin: 0 0 8px !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="footer"] {
        margin: 0 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"][${WATCHED_ATTR}="true"] {
        opacity: 0.45 !important;
      }

      [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"][${WATCHED_ATTR}="true"]:hover {
        opacity: 0.72 !important;
      }

      @media (max-width: 700px) {
        [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] {
          gap: 12px !important;
          min-height: 82px !important;
        }

        [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] .playable-card-mini-static__thumbnail-wrapper--kGEEH,
        [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] {
          flex-basis: 140px !important;
          width: 140px !important;
          min-width: 140px !important;
          max-width: 140px !important;
        }

        [${LIST_CONTENT_ATTR}="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] img {
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

  function getEpisodeNumber(text) {
    const match = String(text || '').match(/\bE\s*(\d+)\b/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function currentWatchPath() {
    return location.pathname.replace(/\/+$/, '');
  }

  function findVisibleEpisodeRoot() {
    const semantic = Array.from(document.querySelectorAll('[aria-label="Episodes in current season"][role="list"], .episode-list[role="list"]'))
      .find(isVisible);
    if (semantic) return semantic;

    const wrappers = Array.from(document.querySelectorAll('[class*="episode-list-content"]')).filter(isVisible);
    for (const wrapper of wrappers) {
      const list = wrapper.querySelector('[aria-label="Episodes in current season"], .episode-list[role="list"]');
      if (list && isVisible(list)) return list;
      if (wrapper.querySelector('[class*="list-content"]')) return wrapper;
    }
    return null;
  }

  function findActualListContent(root) {
    if (!root) return null;
    const direct = root.querySelector(':scope > [class*="list-content"]');
    if (direct && isVisible(direct)) return direct;
    const nested = root.querySelector('[class*="list-content"]');
    if (nested && isVisible(nested)) return nested;
    return root;
  }

  function getEpisodeWrappers(listContent) {
    if (!listContent) return [];

    const direct = Array.from(listContent.children).filter((child) => child instanceof HTMLElement);
    const meaningful = direct.filter((child) => child.querySelector('a[href*="/watch/"]'));
    if (meaningful.length >= 3) return meaningful;

    const links = Array.from(listContent.querySelectorAll('a[href*="/watch/"]'));
    const seen = new Set();
    const wrappers = [];
    for (const link of links) {
      let node = link.closest('.playable-card-mini-static')?.parentElement
        || link.closest('[class*="playable-card"]')?.parentElement
        || link.parentElement;
      while (node && node.parentElement && node.parentElement !== listContent) {
        node = node.parentElement;
      }
      if (!node || node.parentElement !== listContent || seen.has(node)) continue;
      seen.add(node);
      wrappers.push(node);
    }
    return wrappers;
  }

  function markWatched(wrapper) {
    const watchedOverlay = wrapper.querySelector('[class*="watched-overlay"]');
    const text = wrapper.textContent || '';
    const aria = Array.from(wrapper.querySelectorAll('a[aria-label]'))
      .map((a) => a.getAttribute('aria-label') || '')
      .join(' ');
    const watched = Boolean(watchedOverlay) || /\bWatched\b/i.test(text) || /Watch Again/i.test(aria);
    if (watched) wrapper.setAttribute(WATCHED_ATTR, 'true');
    else wrapper.removeAttribute(WATCHED_ATTR);
  }

  function wrapperEpisodeNumber(wrapper) {
    return getEpisodeNumber(wrapper.querySelector('[class*="title"]')?.textContent || wrapper.textContent);
  }

  function findCurrentWrapper(wrappers) {
    const path = currentWatchPath();
    return wrappers.find((wrapper) => Array.from(wrapper.querySelectorAll('a[href*="/watch/"]')).some((a) => {
      try {
        return new URL(a.href, location.origin).pathname.replace(/\/+$/, '') === path;
      } catch {
        return false;
      }
    })) || wrappers.find((wrapper) => wrapper.matches('.card-now-playing'));
  }

  function styleEpisodeList() {
    if (!isEnabled()) return;
    const root = findVisibleEpisodeRoot();
    if (!root) return;

    injectStyles();
    const listContent = findActualListContent(root);
    if (!listContent || !isVisible(listContent)) return;

    root.setAttribute(LIST_ATTR, 'true');
    listContent.setAttribute(LIST_CONTENT_ATTR, 'true');

    const wrappers = getEpisodeWrappers(listContent);
    if (wrappers.length < 3) return;

    // Remove stale ordering markers before reapplying the exact source order.
    wrappers.forEach((wrapper) => wrapper.removeAttribute(ITEM_ATTR));
    wrappers.sort((a, b) => wrapperEpisodeNumber(a) - wrapperEpisodeNumber(b));

    for (const wrapper of wrappers) {
      wrapper.setAttribute(ITEM_ATTR, 'true');
      markWatched(wrapper);
      listContent.appendChild(wrapper);
    }

    const current = findCurrentWrapper(wrappers);
    if (current && current !== lastTarget) {
      lastTarget = current;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (isVisible(current)) {
          current.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        }
      }));
    }
  }

  function removeV217Effects() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    removeStyles();
    document.querySelectorAll(`[${LIST_ATTR}="true"]`).forEach((el) => el.removeAttribute(LIST_ATTR));
    document.querySelectorAll(`[${LIST_CONTENT_ATTR}="true"]`).forEach((el) => el.removeAttribute(LIST_CONTENT_ATTR));
    document.querySelectorAll(`[${ITEM_ATTR}="true"]`).forEach((el) => {
      el.removeAttribute(ITEM_ATTR);
      el.removeAttribute(WATCHED_ATTR);
    });
    document.querySelectorAll(`[${DISCOVER_MOVED_ATTR}="true"]`).forEach((el) => el.removeAttribute(DISCOVER_MOVED_ATTR));
    document.getElementById(OVERLAY_ID)?.remove();
    lastTarget = null;
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) {
      removeV217Effects();
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
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      setEnabled(changes[STORAGE_KEY].newValue !== false);
    }
  });

  startButtonHook();
})();
