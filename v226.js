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

  const STYLE_ID = 'better-crunchyroll-v226-style';
  const LIST_SELECTOR = '.erc-episode-list-modal .erc-playable-collection.state-dt-condensed';
  let enabled = true;
  let observer = null;
  let settings = { ...DEFAULTS, shortcuts: { ...DEFAULTS.shortcuts } };
  const lastAutoSkip = new Map();

  const isTyping = (target) => {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
  };

  const visible = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  const cardEpisodeNumber = (card) => {
    const text = card?.textContent || '';
    const match = text.match(/\bE(?:pisode)?\s*(\d+)\b/i);
    return match ? Number(match[1]) : NaN;
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-blur-upcoming="true"] [class*="thumbnail-wrapper"] {
        overflow: hidden !important;
        border-radius: 6px !important;
      }
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-blur-upcoming="true"] [class*="thumbnail-wrapper"] img {
        filter: blur(10px) !important;
        transform: scale(1.05) !important;
        transform-origin: center !important;
      }
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] [class*="playable-card__title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] [class*="title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] h3 {
        font-size: 0 !important;
      }
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] [class*="playable-card__title"]::after,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] [class*="title"]::after,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-hide-title="true"] h3::after {
        content: attr(data-better-crunchyroll-episode-label) !important;
        font-size: 16px !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function findVisibleEpisodeCollection() {
    return Array.from(document.querySelectorAll(LIST_SELECTOR)).find(visible) || null;
  }

  function currentWatchPath() {
    return location.pathname.replace(/\/+$/, '');
  }

  function currentEpisodeCard(collection) {
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

  function updateSpoilerProtection() {
    const collection = findVisibleEpisodeCollection();
    if (!collection) return;
    const cards = Array.from(collection.children).filter((el) => el instanceof HTMLElement && el.matches('.card'));
    const currentNumber = cardEpisodeNumber(currentEpisodeCard(collection));
    for (const card of cards) {
      card.removeAttribute('data-better-crunchyroll-blur-upcoming');
      card.removeAttribute('data-better-crunchyroll-hide-title');
      card.removeAttribute('data-better-crunchyroll-episode-label');
      const number = cardEpisodeNumber(card);
      if (!Number.isFinite(currentNumber) || !Number.isFinite(number) || number <= currentNumber) continue;
      if (settings.blurUpcoming) card.setAttribute('data-better-crunchyroll-blur-upcoming', 'true');
      if (settings.hideUpcomingTitles) {
        card.setAttribute('data-better-crunchyroll-hide-title', 'true');
        card.setAttribute('data-better-crunchyroll-episode-label', `Episode ${number}`);
      }
    }
  }

  function findButtonByMeaning(patterns) {
    const candidates = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(visible);
    for (const el of candidates) {
      const haystack = [el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.textContent || ''].join(' ').replace(/\s+/g, ' ').trim();
      if (patterns.some((pattern) => pattern.test(haystack))) return el;
    }
    return null;
  }

  function findSkipButton(type) {
    const patterns = {
      intro: [/^\s*skip\s+intro\s*$/i, /skip\s+intro/i],
      recap: [/^\s*skip\s+recap\s*$/i, /skip\s+recap/i],
      credits: [/^\s*skip\s+credits\s*$/i, /skip\s+credits/i],
    }[type] || [];
    return findButtonByMeaning(patterns);
  }

  function skipActive() {
    for (const type of ['intro', 'recap', 'credits']) {
      const button = findSkipButton(type);
      if (button) {
        button.click();
        return true;
      }
    }
    return false;
  }

  function autoSkip(type, enabledSetting) {
    if (!enabled || !enabledSetting) return;
    const button = findSkipButton(type);
    if (!button) return;
    const now = Date.now();
    const previous = lastAutoSkip.get(type) || 0;
    if (now - previous < 1500) return;
    lastAutoSkip.set(type, now);
    button.click();
  }

  function findEpisodeNavButton(direction) {
    const patterns = direction === 'next'
      ? [/^\s*next\s+episode\s*$/i, /next\s+episode/i]
      : [/^\s*previous\s+episode\s*$/i, /previous\s+episode/i];
    return findButtonByMeaning(patterns);
  }

  function handleShortcut(event) {
    if (!enabled || event.repeat || isTyping(event.target) || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === settings.shortcuts.skip) {
      if (skipActive()) event.preventDefault();
      return;
    }
    if (event.code === settings.shortcuts.previous) {
      const button = findEpisodeNavButton('previous');
      if (button) { event.preventDefault(); button.click(); }
      return;
    }
    if (event.code === settings.shortcuts.next) {
      const button = findEpisodeNavButton('next');
      if (button) { event.preventDefault(); button.click(); }
    }
  }

  function removeEnhancements() {
    removeStyles();
    document.querySelectorAll('[data-better-crunchyroll-blur-upcoming], [data-better-crunchyroll-hide-title], [data-better-crunchyroll-episode-label]').forEach((el) => {
      el.removeAttribute('data-better-crunchyroll-blur-upcoming');
      el.removeAttribute('data-better-crunchyroll-hide-title');
      el.removeAttribute('data-better-crunchyroll-episode-label');
    });
    lastAutoSkip.clear();
    if (observer) { observer.disconnect(); observer = null; }
  }

  function refresh() {
    if (!enabled) return;
    injectStyles();
    updateSpoilerProtection();
    autoSkip('intro', settings.autoSkipIntro);
    autoSkip('recap', settings.autoSkipRecap);
    autoSkip('credits', settings.autoSkipCredits);
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) {
      removeEnhancements();
      return;
    }
    injectStyles();
    if (!observer) {
      observer = new MutationObserver(() => refresh());
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    refresh();
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

  document.addEventListener('keydown', handleShortcut, true);
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[STORAGE.enabled]) setEnabled(changes[STORAGE.enabled].newValue !== false);
    if (changes[STORAGE.shortcuts] || changes[STORAGE.autoSkipIntro] || changes[STORAGE.autoSkipRecap] || changes[STORAGE.autoSkipCredits] || changes[STORAGE.blurUpcoming] || changes[STORAGE.hideUpcomingTitles]) loadSettings();
  });

  loadSettings();
})();
