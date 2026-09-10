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

  const STYLE_ID = 'better-crunchyroll-v236-style';
  const BLUR_ATTR = 'data-better-crunchyroll-blur-upcoming';
  const TITLE_ATTR = 'data-better-crunchyroll-title-hidden';

  let enabled = true;
  let settings = structuredClone(DEFAULTS);
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
      .episode-list-content [data-t^="episode-card"][${BLUR_ATTR}="true"] [data-t="card-image"],
      .episode-list-content [data-t^="episode-card"][${BLUR_ATTR}="true"] img[data-t="card-image"] {
        filter: blur(10px) !important;
        transform: scale(1.05) !important;
        transform-origin: center !important;
      }

      .episode-list-content [data-t^="episode-card"] [${TITLE_ATTR}="true"] {
        visibility: hidden !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyles() { document.getElementById(STYLE_ID)?.remove(); }

  function episodeListRoots() {
    return Array.from(document.querySelectorAll('.episode-list-content')).filter((el) => el instanceof HTMLElement);
  }

  function getEpisodeCards(root) {
    if (!(root instanceof HTMLElement)) return [];
    const preferred = Array.from(root.querySelectorAll('[data-t^="episode-card"]'))
      .filter((el) => el instanceof HTMLElement && el.querySelector('a[href*="/watch/"]'));
    if (preferred.length) return preferred;
    return Array.from(root.querySelectorAll('.card'))
      .filter((el) => el instanceof HTMLElement && el.querySelector('a[href*="/watch/"]'));
  }

  function currentWatchPath() { return location.pathname.replace(/\/+$/, ''); }

  function normalizedWatchPath(href) {
    try { return new URL(href, location.origin).pathname.replace(/\/+$/, ''); }
    catch { return ''; }
  }

  function cardWatchPaths(card) {
    return Array.from(card.querySelectorAll('a[href*="/watch/"]'))
      .map((a) => normalizedWatchPath(a.getAttribute('href') || a.href)).filter(Boolean);
  }

  function currentEpisodeCard(cards) {
    const path = currentWatchPath();
    if (!path.includes('/watch/')) return null;
    return cards.find((card) => cardWatchPaths(card).includes(path)) || null;
  }

  function episodeInfoFromTitle(card) {
    if (!(card instanceof HTMLElement)) return null;
    const titles = Array.from(card.querySelectorAll('[data-t="episode-title"], [class*="playable-card__title"]'));
    const title = titles.find((el) => (el.textContent || '').trim()) || card.querySelector('h3') || card.querySelector('[role="heading"]');
    const text = (title?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    let match = text.match(/\bS\s*(\d+)\s*E\s*(\d+)\b/i);
    if (match) return { season: Number(match[1]), episode: Number(match[2]) };
    match = text.match(/(?<![A-Za-z])E(?:p(?:isode)?)?\.?\s*(\d+)\b/i);
    if (match) return { season: null, episode: Number(match[1]) };
    return null;
  }

  function inferDisplayOrder(cards) {
    const numbered = cards.map((card, index) => ({ index, info: episodeInfoFromTitle(card) })).filter((entry) => Number.isFinite(entry.info?.episode));
    if (numbered.length < 2) return 'unknown';
    let asc = 0, desc = 0;
    for (let i = 1; i < numbered.length; i++) {
      const a = numbered[i - 1].info, b = numbered[i].info;
      if (b.episode > a.episode) asc++;
      if (b.episode < a.episode) desc++;
    }
    if (asc > desc) return 'ascending';
    if (desc > asc) return 'descending';
    return 'unknown';
  }

  function isUpcoming(card, currentCard, cards) {
    if (!card || !currentCard || card === currentCard) return false;
    const info = episodeInfoFromTitle(card), currentInfo = episodeInfoFromTitle(currentCard);
    if (info && currentInfo && Number.isFinite(info.episode) && Number.isFinite(currentInfo.episode)) {
      if (Number.isFinite(info.season) && Number.isFinite(currentInfo.season) && info.season !== currentInfo.season) return info.season > currentInfo.season;
      if (info.episode !== currentInfo.episode) return info.episode > currentInfo.episode;
    }
    const order = inferDisplayOrder(cards);
    const cardIndex = cards.indexOf(card), currentIndex = cards.indexOf(currentCard);
    if (order === 'ascending') return cardIndex > currentIndex;
    if (order === 'descending') return cardIndex < currentIndex;
    return false;
  }

  function titleElements(card) {
    if (!(card instanceof HTMLElement)) return [];
    const selectors = ['[data-t="episode-title"]', '[class*="playable-card__title"]', '[class*="playable-card-hover__title"]'];
    const seen = new Set(), result = [];
    for (const selector of selectors) {
      for (const element of card.querySelectorAll(selector)) {
        if (!(element instanceof HTMLElement) || seen.has(element)) continue;
        seen.add(element); result.push(element);
      }
    }
    if (result.length) return result;
    return Array.from(card.querySelectorAll('h3, [role="heading"]'));
  }

  function restoreTitle(card) { titleElements(card).forEach((title) => title.removeAttribute(TITLE_ATTR)); }
  function applyHiddenTitle(card) { titleElements(card).forEach((title) => title.setAttribute(TITLE_ATTR, 'true')); }

  function updateSpoilersForRoot(root) {
    const cards = getEpisodeCards(root);
    if (!cards.length) return;
    const current = currentEpisodeCard(cards);
    for (const card of cards) { card.removeAttribute(BLUR_ATTR); restoreTitle(card); }
    if (!current) return;
    for (const card of cards) {
      if (!isUpcoming(card, current, cards)) continue;
      if (settings.hideUpcomingTitles) applyHiddenTitle(card);
      if (settings.blurUpcoming) card.setAttribute(BLUR_ATTR, 'true');
    }
  }

  function updateAllEpisodeLists() { for (const root of episodeListRoots()) updateSpoilersForRoot(root); }

  function scheduleEpisodeListRefreshes() {
    if (!enabled) return;
    for (const ms of [0, 60, 150, 300, 600, 1000, 1800, 3000]) setTimeout(() => { if (enabled) updateAllEpisodeLists(); }, ms);
  }

  function observeEpisodeLists() {
    if (!enabled || document.documentElement.__betterCrunchyrollV236Observed) return;
    document.documentElement.__betterCrunchyrollV236Observed = true;
    const observer = new MutationObserver((mutations) => {
      if (!enabled) return;
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        const relevant = [...mutation.addedNodes].some((node) => {
          if (!(node instanceof Element)) return false;
          return node.matches?.('.episode-list-content,[data-t^="episode-card"],.card') || !!node.querySelector?.('.episode-list-content,[data-t^="episode-card"],.card');
        });
        if (relevant) { scheduleEpisodeListRefreshes(); break; }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function findMeaningButton(patterns) {
    return Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(visible).find((el) => {
      const text = [el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.textContent || ''].join(' ').replace(/\s+/g, ' ').trim();
      return patterns.some((p) => p.test(text));
    }) || null;
  }
  function findSkipButton(type) {
    const patterns = { intro: [/^\s*skip\s+intro\s*$/i, /skip\s+intro/i], recap: [/^\s*skip\s+recap\s*$/i, /skip\s+recap/i], credits: [/^\s*skip\s+credits\s*$/i, /skip\s+credits/i] };
    return findMeaningButton(patterns[type] || []);
  }
  function skipActive() { for (const type of ['intro', 'recap', 'credits']) { const button = findSkipButton(type); if (button) { button.click(); return true; } } return false; }
  function autoSkip(type, flag) {
    if (!enabled || !flag) return;
    const button = findSkipButton(type); if (!button) return;
    const now = Date.now(); if (now - lastSkip[type] < 1600) return;
    lastSkip[type] = now; button.click();
  }
  function findEpisodeNav(direction) {
    const patterns = direction === 'next' ? [/^\s*next\s+episode\s*$/i, /next\s+episode/i] : [/^\s*previous\s+episode\s*$/i, /previous\s+episode/i];
    return findMeaningButton(patterns);
  }
  function handleShortcut(event) {
    if (!enabled || event.repeat || isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === settings.shortcuts.skip) { if (skipActive()) event.preventDefault(); return; }
    if (event.code === settings.shortcuts.previous) { const button = findEpisodeNav('previous'); if (button) { event.preventDefault(); button.click(); } return; }
    if (event.code === settings.shortcuts.next) { const button = findEpisodeNav('next'); if (button) { event.preventDefault(); button.click(); } }
  }

  function removeEnhancements() {
    removeStyles();
    document.querySelectorAll(`[${BLUR_ATTR}="true"]`).forEach((el) => el.removeAttribute(BLUR_ATTR));
    document.querySelectorAll(`[${TITLE_ATTR}="true"]`).forEach((title) => title.removeAttribute(TITLE_ATTR));
    lastSkip = { intro: 0, recap: 0, credits: 0 };
  }
  function refresh() {
    if (!enabled) return;
    injectStyles(); observeEpisodeLists(); updateAllEpisodeLists();
    autoSkip('intro', settings.autoSkipIntro); autoSkip('recap', settings.autoSkipRecap); autoSkip('credits', settings.autoSkipCredits);
  }
  function scheduleRefresh(delay = 0) {
    if (!enabled) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { refresh(); for (const ms of [120, 350, 800, 1600]) setTimeout(() => { if (enabled) refresh(); }, ms); }, delay);
  }
  function detectNavigation() { if (location.href !== lastUrl) { lastUrl = location.href; scheduleRefresh(0); } }
  function setEnabled(next) { enabled = next !== false; if (!enabled) { removeEnhancements(); return; } injectStyles(); scheduleRefresh(0); }

  async function loadSettings() {
    const stored = await chrome.storage.local.get({ [STORAGE.enabled]: true, [STORAGE.shortcuts]: DEFAULTS.shortcuts, [STORAGE.autoSkipIntro]: DEFAULTS.autoSkipIntro, [STORAGE.autoSkipRecap]: DEFAULTS.autoSkipRecap, [STORAGE.autoSkipCredits]: DEFAULTS.autoSkipCredits, [STORAGE.blurUpcoming]: DEFAULTS.blurUpcoming, [STORAGE.hideUpcomingTitles]: DEFAULTS.hideUpcomingTitles });
    settings = { shortcuts: { ...DEFAULTS.shortcuts, ...(stored[STORAGE.shortcuts] || {}) }, autoSkipIntro: Boolean(stored[STORAGE.autoSkipIntro]), autoSkipRecap: Boolean(stored[STORAGE.autoSkipRecap]), autoSkipCredits: Boolean(stored[STORAGE.autoSkipCredits]), blurUpcoming: Boolean(stored[STORAGE.blurUpcoming]), hideUpcomingTitles: Boolean(stored[STORAGE.hideUpcomingTitles]) };
    setEnabled(stored[STORAGE.enabled] !== false);
  }

  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function(...args) { const result = original.apply(this, args); window.dispatchEvent(new Event('better-crunchyroll-v236-navigation')); return result; };
  }
  window.addEventListener('better-crunchyroll-v236-navigation', detectNavigation);
  window.addEventListener('popstate', detectNavigation);
  window.addEventListener('hashchange', detectNavigation);
  setInterval(detectNavigation, 700);

  document.addEventListener('click', (event) => {
    if (!enabled) return;
    const target = event.target?.closest?.('button, a, [role="button"]');
    if (!target) return;
    const text = [target.getAttribute('aria-label') || '', target.getAttribute('title') || '', target.textContent || ''].join(' ').replace(/\s+/g, ' ').trim();
    if (/episode|episodes/i.test(text)) scheduleRefresh(30);
  }, true);
  document.addEventListener('keydown', handleShortcut, true);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes[STORAGE.enabled]) setEnabled(changes[STORAGE.enabled].newValue !== false);
    if (changes[STORAGE.shortcuts] || changes[STORAGE.autoSkipIntro] || changes[STORAGE.autoSkipRecap] || changes[STORAGE.autoSkipCredits] || changes[STORAGE.blurUpcoming] || changes[STORAGE.hideUpcomingTitles]) loadSettings();
  });
  loadSettings();
})();
