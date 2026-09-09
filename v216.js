(() => {
  const TITLE_ID = 'better-crunchyroll-episode-title';
  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const STYLE_ID = 'better-crunchyroll-v216-style';
  const ITEM_ATTR = 'data-better-crunchyroll-v216-item';
  const WATCHED_ATTR = 'data-better-crunchyroll-v216-watched';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep the v2.15 optical title tweak: 3px lower and optically centered. */
      #${TITLE_ID} {
        bottom: 13px !important;
        transform: translateX(calc(-50% - 2px)) !important;
      }

      @media (min-width: 1024px) {
        #${TITLE_ID} {
          bottom: 21px !important;
          transform: translateX(calc(-50% - 2px)) !important;
        }
      }

      /* v2.16: the requested SVG adjustment is for the BACK button only. */
      #better-crunchyroll-back .back-icon {
        transform: translateX(-2px) !important;
      }

      #better-crunchyroll-back {
        background: transparent !important;
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      #better-crunchyroll-back:hover,
      #better-crunchyroll-back:focus-visible {
        background: #3f3f46 !important;
        background-color: #3f3f46 !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      /* This is the actual visible episode-list content wrapper from the
         open native dialog. Do not style the hidden .videos section. */
      [data-better-crunchyroll-v216-list="true"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        box-sizing: border-box !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] {
        display: flex !important;
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

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] {
        flex: 0 0 180px !important;
        width: 180px !important;
        max-width: 180px !important;
        min-width: 180px !important;
        margin: 0 !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] img {
        width: 180px !important;
        height: 101px !important;
        max-width: 180px !important;
        max-height: 101px !important;
        object-fit: cover !important;
        border-radius: 2px !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="body-aligner"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="body--"] {
        width: 100% !important;
        min-width: 0 !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] h3,
      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="title"] {
        margin: 0 0 8px !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="footer"] {
        margin: 0 !important;
      }

      /* Watched episodes are dimmed, including their thumbnails. */
      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"][${WATCHED_ATTR}="true"] {
        opacity: 0.45 !important;
      }

      [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"][${WATCHED_ATTR}="true"]:hover {
        opacity: 0.72 !important;
      }

      [data-better-crunchyroll-v216-list-scroll="true"] {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        min-height: 0 !important;
      }

      @media (max-width: 700px) {
        [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] {
          gap: 12px !important;
          min-height: 82px !important;
        }

        [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] {
          flex-basis: 140px !important;
          width: 140px !important;
          max-width: 140px !important;
          min-width: 140px !important;
        }

        [data-better-crunchyroll-v216-list="true"] > [${ITEM_ATTR}="true"] [class*="thumbnail-wrapper"] img {
          width: 140px !important;
          height: 79px !important;
          max-width: 140px !important;
          max-height: 79px !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function isVisible(element) {
    if (!element) return false;
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return computed.display !== 'none'
      && computed.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }

  function getEpisodeNumber(text) {
    const match = String(text || '').match(/\bE\s*(\d+)\b/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function getCurrentWatchPath() {
    return window.location.pathname.replace(/\/+$/, '');
  }

  function findEpisodeDialog() {
    let best = null;
    let bestScore = -1;

    for (const dialog of document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]')) {
      if (!isVisible(dialog)) continue;

      const content = dialog.querySelector('[class*="episode-list-content"]');
      const seasonList = dialog.querySelector('[aria-label="Episodes in current season"], [data-t="episode-list"]');
      const watchLinks = dialog.querySelectorAll('a[href*="/watch/"]');
      if (!content && !seasonList) continue;
      if (watchLinks.length < 3) continue;

      let candidateScore = watchLinks.length;
      if (content) candidateScore += 1000;
      if (seasonList) candidateScore += 500;
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        best = dialog;
      }
    }

    return best;
  }

  function findVisibleListContent(dialog) {
    if (!dialog) return null;
    const content = dialog.querySelector('[class*="episode-list-content"]');
    if (content && isVisible(content)) return content;

    const list = dialog.querySelector('[aria-label="Episodes in current season"], [data-t="episode-list"]');
    return list && isVisible(list) ? list : null;
  }

  function findCard(link, listContainer) {
    const directCard = link.closest('[data-t="playable-card-mini"]');
    if (directCard) return directCard;

    let current = link.parentElement;
    for (let depth = 0; current && current !== listContainer && depth < 8; depth += 1) {
      const cls = typeof current.className === 'string' ? current.className.toLowerCase() : '';
      if (current.querySelector('img') && /playable-card-mini-static|playable-card|episode|card/.test(cls)) {
        return current;
      }
      current = current.parentElement;
    }
    return link.parentElement;
  }

  function getCards(listContainer) {
    const links = Array.from(listContainer.querySelectorAll('a[href*="/watch/"]'));
    const cards = [];
    const seen = new Set();

    for (const link of links) {
      const card = findCard(link, listContainer);
      if (!card || seen.has(card) || !listContainer.contains(card) || !isVisible(card)) continue;
      seen.add(card);
      cards.push(card);
    }

    return cards;
  }

  function episodeLabel(card) {
    return card.querySelector('h3, [class*="title"]')?.textContent || card.textContent || '';
  }

  function prepareList(listContainer) {
    if (!listContainer) return false;

    injectStyles();
    listContainer.setAttribute('data-better-crunchyroll-v216-list', 'true');

    const cards = getCards(listContainer);
    if (cards.length < 3) return false;

    const wrappers = [];
    const seen = new Set();

    for (const card of cards) {
      let wrapper = card;
      while (wrapper.parentElement && wrapper.parentElement !== listContainer) {
        wrapper = wrapper.parentElement;
      }
      if (wrapper.parentElement !== listContainer || seen.has(wrapper)) continue;
      seen.add(wrapper);
      wrappers.push(wrapper);
    }

    if (wrappers.length < 3) return false;

    // Keep the natural episode order E1 -> latest episode.
    wrappers.sort((a, b) => getEpisodeNumber(episodeLabel(a)) - getEpisodeNumber(episodeLabel(b)));
    for (const wrapper of wrappers) {
      wrapper.setAttribute(ITEM_ATTR, 'true');
      const text = wrapper.textContent || '';
      const aria = wrapper.querySelector('a[aria-label*="Watch Again" i]')?.getAttribute('aria-label') || '';
      const watched = /\bWatched\b/i.test(text) || /Watch Again/i.test(aria);
      if (watched) wrapper.setAttribute(WATCHED_ATTR, 'true');
      else wrapper.removeAttribute(WATCHED_ATTR);
      listContainer.appendChild(wrapper);
    }

    const scrollable = listContainer.closest('.scrollable-section, [class*="scrollable-section"]');
    if (scrollable) scrollable.setAttribute('data-better-crunchyroll-v216-list-scroll', 'true');

    const currentPath = getCurrentWatchPath();
    const currentCard = wrappers.find((wrapper) => Array.from(wrapper.querySelectorAll('a[href*="/watch/"]')).some((link) => {
      try {
        return new URL(link.href, window.location.origin).pathname.replace(/\/+$/, '') === currentPath;
      } catch {
        return false;
      }
    }));

    if (currentCard) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          currentCard.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        });
      });
    }

    return true;
  }

  function applyAfterOpen() {
    for (const delay of [0, 50, 120, 250, 500, 900, 1500]) {
      window.setTimeout(() => {
        const dialog = findEpisodeDialog();
        const content = findVisibleListContent(dialog);
        if (content) prepareList(content);
      }, delay);
    }
  }

  injectStyles();

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.(`#${EPISODE_BUTTON_ID}`);
    if (button) applyAfterOpen();
  }, true);

  const observer = new MutationObserver(() => {
    const dialog = findEpisodeDialog();
    const content = findVisibleListContent(dialog);
    if (content) prepareList(content);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
