(() => {
  const STORAGE = {
    enabled: 'betterCrunchyrollEnabled',
    shortcuts: 'betterCrunchyrollShortcuts',
    autoSkipIntro: 'betterCrunchyrollAutoSkipIntro',
    autoSkipRecap: 'betterCrunchyrollAutoSkipRecap',
    autoSkipCredits: 'betterCrunchyrollAutoSkipCredits',
    blurUpcoming: 'betterCrunchyrollBlurUpcoming',
    hideUpcomingTitles: 'betterCrunchyrollHideUpcomingTitles',
  };

  const DEFAULTS = {
    shortcuts: { skip: 'KeyS', previous: 'KeyP', next: 'KeyN' },
    autoSkipIntro: false,
    autoSkipRecap: false,
    autoSkipCredits: false,
    blurUpcoming: false,
    hideUpcomingTitles: false,
  };

  const STYLE_ID = 'better-crunchyroll-v229-style';
  const BLUR_ATTR = 'data-better-crunchyroll-blur-upcoming';
  const TITLE_ATTR = 'data-better-crunchyroll-title-hidden';
  const ORIGINAL_TITLE_ATTR = 'data-better-crunchyroll-original-title-v229';

  let enabled = true;
  let settings = structuredClone(DEFAULTS);
  let observer = null;
  let refreshTimer = null;
  let lastUrl = location.href;
  let lastSkip = { intro: 0, recap: 0, credits: 0 };

  const visible = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  const isTyping = (target) => {
    const tag = target?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[${BLUR_ATTR}="true"] [class*="thumbnail-wrapper"] {
        overflow: hidden !important;
        border-radius: 5px !important;
      }
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[${BLUR_ATTR}="true"] [class*="thumbnail-wrapper"] img {
        filter: blur(10px) !important;
        transform: scale(1.045) !important;
        transform-origin: center !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function getCollections() {
    return Array.from(document.querySelectorAll(
      '.erc-episode-list-modal .erc-playable-collection.state-dt-condensed'
    )).filter(visible);
  }

  function cardEpisodeNumber(card) {
    const text = card?.textContent || '';
    const match = text.match(/\bE(?:pisode)?\s*(\d+)\b/i);
    return match ? Number(match[1]) : NaN;
  }

  function currentEpisodeCard(collection) {
    const currentPath = location.pathname.replace(/\/+$/, '');
    const cards = Array.from(collection.children).filter(
      (el) => el instanceof HTMLElement && el.matches('.card')
    );
    return cards.find((card) =>
      Array.from(card.querySelectorAll('a[href*="/watch/"]')).some((a) => {
        try {
          return new URL(a.href, location.origin).pathname.replace(/\/+$/, '') === currentPath;
        } catch { return false; }
      })
    ) || cards.find((card) => /NOW PLAYING/i.test(card.textContent || '')) || null;
  }

  function titleElement(card) {
    return card.querySelector('h3')
      || card.querySelector('[class*="playable-card__title"]')
      || card.querySelector('[class*="title"]')
      || null;
  }

  function restoreTitle(card) {
    const title = titleElement(card);
    if (!title || !title.hasAttribute(TITLE_ATTR)) return;
    const original = title.getAttribute(ORIGINAL_TITLE_ATTR);
    if (original !== null) title.textContent = original;
    title.removeAttribute(TITLE_ATTR);
    title.removeAttribute(ORIGINAL_TITLE_ATTR);
  }

  function applyHiddenTitle(card, number) {
    const title = titleElement(card);
    if (!title || !Number.isFinite(number)) return;
    if (!title.hasAttribute(ORIGINAL_TITLE_ATTR)) {
      title.setAttribute(ORIGINAL_TITLE_ATTR, title.textContent || '');
    }
    const replacement = `Episode ${number}`;
    if (title.textContent !== replacement) title.textContent = replacement;
    title.setAttribute(TITLE_ATTR, 'true');
  }

  function updateSpoilersForCollection(collection) {
    const cards = Array.from(collection.children).filter(
      (el) => el instanceof HTMLElement && el.matches('.card')
    );
    const current = currentEpisodeCard(collection);
    const currentNumber = cardEpisodeNumber(current);

    for (const card of cards) {
      card.removeAttribute(BLUR_ATTR);
      if (!Number.isFinite(currentNumber)) {
        restoreTitle(card);
        continue;
      }
      const number = cardEpisodeNumber(card);
      const upcoming = Number.isFinite(number) && number > currentNumber;
      if (upcoming && settings.hideUpcomingTitles) applyHiddenTitle(card, number);
      else restoreTitle(card);
      if (upcoming && settings.blurUpcoming) card.setAttribute(BLUR_ATTR, 'true');
    }
  }

  function updateAllEpisodeLists() {
    for (const collection of getCollections()) updateSpoilersForCollection(collection);
  }

  function findMeaningButton(patterns) {
    return Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .filter(visible)
      .find((el) => {
        const text = [el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.textContent || '']
          .join(' ').replace(/\s+/g, ' ').trim();
        return patterns.some((p) => p.test(text));
      }) || null;
  }

  function findSkipButton(type) {
    const patterns = {
      intro: [/^\s*skip\s+intro\s*$/i, /skip\s+intro/i],
      recap: [/^\s*skip\s+recap\s*$/i, /skip\s+recap/i],
      credits: [/^\s*skip\s+credits\s*$/i, /skip\s+credits/i],
    };
    return findMeaningButton(patterns[type] || []);
  }

  function skipActive() {
    for (const type of ['intro', 'recap', 'credits']) {
      const button = findSkipButton(type);
      if (button) { button.click(); return true; }
    }
    return false;
  }

  function autoSkip(type, flag) {
    if (!enabled || !flag) return;
    const button = findSkipButton(type);
    if (!button) return;
    const now = Date.now();
    if (now - lastSkip[type] < 1600) return;
    lastSkip[type] = now;
    button.click();
  }

  function findEpisodeNav(direction) {
    const patterns = direction === 'next'
      ? [/^\s*next\s+episode\s*$/i, /next\s+episode/i]
      : [/^\s*previous\s+episode\s*$/i, /previous\s+episode/i];
    return findMeaningButton(patterns);
  }

  function handleShortcut(event) {
    if (!enabled || event.repeat || isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === settings.shortcuts.skip) {
      if (skipActive()) event.preventDefault();
      return;
    }
    if (event.code === settings.shortcuts.previous) {
      const button = findEpisodeNav('previous');
      if (button) { event.preventDefault(); button.click(); }
      return;
    }
    if (event.code === settings.shortcuts.next) {
      const button = findEpisodeNav('next');
      if (button) { event.preventDefault(); button.click(); }
    }
  }

  function removeEnhancements() {
    removeStyles();
    document.querySelectorAll(`[${BLUR_ATTR}="true"]`).forEach((el) => el.removeAttribute(BLUR_ATTR));
    document.querySelectorAll(`[${TITLE_ATTR}="true"]`).forEach((title) => {
      const original = title.getAttribute(ORIGINAL_TITLE_ATTR);
      if (original !== null) title.textContent = original;
      title.removeAttribute(TITLE_ATTR);
      title.removeAttribute(ORIGINAL_TITLE_ATTR);
    });
    lastSkip = { intro: 0, recap: 0, credits: 0 };
  }

  function refresh() {
    if (!enabled) return;
    injectStyles();
    updateAllEpisodeLists();
    autoSkip('intro', settings.autoSkipIntro);
    autoSkip('recap', settings.autoSkipRecap);
    autoSkip('credits', settings.autoSkipCredits);
  }

  function scheduleRefresh(delay = 0) {
    if (!enabled) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refresh();
      for (const ms of [100, 300, 700, 1500]) {
        setTimeout(() => { if (enabled) refresh(); }, ms);
      }
    }, delay);
  }

  function detectNavigation() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scheduleRefresh();
    }
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) { removeEnhancements(); return; }
    injectStyles();
    if (!observer) {
      observer = new MutationObserver(() => scheduleRefresh(25));
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    scheduleRefresh();
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get({
      [STORAGE.enabled]: true,
      [STORAGE.shortcuts]: DEFAULTS.shortcuts,
      [STORAGE.autoSkipIntro]: DEFAULTS.autoSkipIntro,
      [STORAGE.autoSkipRecap]: DEFAULTS.autoSkipRecap,
      [STORAGE.autoSkipCredits]: DEFAULTS.autoSkipCredits,
      [STORAGE.blurUpcoming]: DEFAULTS.blurUpcoming,
      [STORAGE.hideUpcomingTitles]: DEFAULTS.hideUpcomingTitles,
    });
    settings = {
      shortcuts: { ...DEFAULTS.shortcuts, ...(stored[STORAGE.shortcuts] || {}) },
      autoSkipIntro: Boolean(stored[STORAGE.autoSkipIntro]),
      autoSkipRecap: Boolean(stored[STORAGE.autoSkipRecap]),
      autoSkipCredits: Boolean(stored[STORAGE.autoSkipCredits]),
      blurUpcoming: Boolean(stored[STORAGE.blurUpcoming]),
      hideUpcomingTitles: Boolean(stored[STORAGE.hideUpcomingTitles]),
    };
    setEnabled(stored[STORAGE.enabled] !== false);
  }

  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function(...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event('better-crunchyroll-v229-navigation'));
      return result;
    };
  }
  window.addEventListener('better-crunchyroll-v229-navigation', detectNavigation);
  window.addEventListener('popstate', detectNavigation);
  window.addEventListener('hashchange', detectNavigation);
  setInterval(detectNavigation, 500);
  document.addEventListener('keydown', handleShortcut, true);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[STORAGE.enabled]) setEnabled(changes[STORAGE.enabled].newValue !== false);
    if (changes[STORAGE.shortcuts] || changes[STORAGE.autoSkipIntro] || changes[STORAGE.autoSkipRecap] ||
        changes[STORAGE.autoSkipCredits] || changes[STORAGE.blurUpcoming] || changes[STORAGE.hideUpcomingTitles]) {
      loadSettings();
    }
  });

  loadSettings();
})();
