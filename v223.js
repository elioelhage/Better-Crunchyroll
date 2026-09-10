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

  const STYLE_ID = 'better-crunchyroll-v223-style';
  const LIST_SELECTOR = '.erc-episode-list-modal .erc-playable-collection.state-dt-condensed';
  let enabled = true;
  let observer = null;
  let settings = { ...DEFAULTS, shortcuts: { ...DEFAULTS.shortcuts } };
  const autoSkipState = new WeakSet();

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
      /* v2.23: spoiler protection with softer edges and ~5% less image enlargement. */
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"] [class*="thumbnail-wrapper"] {
        overflow: hidden !important;
        border-radius: 7px !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"] [class*="thumbnail-wrapper"] img {
        filter: blur(11px) !important;
        transform: scale(1) !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"] [class*="playable-card__title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"] [class*="title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"] h3 {
        text-shadow: none !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] [class*="playable-card__title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] [class*="title"],
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] h3 {
        font-size: 0 !important;
      }

      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] [class*="playable-card__title"]::after,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] [class*="title"]::after,
      .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card[data-better-crunchyroll-upcoming="true"][data-better-crunchyroll-hide-title="true"] h3::after {
        content: attr(data-better-crunchyroll-episode-label);
        font-size: 16px;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyles() { document.getElementById(STYLE_ID)?.remove(); }

  function findVisibleEpisodeCollection() {
    return Array.from(document.querySelectorAll(LIST_SELECTOR)).find(visible) || null;
  }

  function updateSpoilerProtection() {
    if (!enabled) return;
    const collection = findVisibleEpisodeCollection();
    if (!collection) return;
    const cards = Array.from(collection.children).filter((el) => el instanceof HTMLElement && el.matches('.card'));
    const currentUrl = location.pathname.replace(/\/+$/, '');
    const current = cards.find((card) => Array.from(card.querySelectorAll('a[href*="/watch/"]')).some((a) => {
      try { return new URL(a.href, location.origin).pathname.replace(/\/+$/, '') === currentUrl; } catch { return false; }
    })) || null;
    const currentNumber = cardEpisodeNumber(current);
    for (const card of cards) {
      card.removeAttribute('data-better-crunchyroll-upcoming');
      card.removeAttribute('data-better-crunchyroll-hide-title');
      card.removeAttribute('data-better-crunchyroll-episode-label');
      const n = cardEpisodeNumber(card);
      if (!Number.isFinite(currentNumber) || !Number.isFinite(n) || n <= currentNumber) continue;
      card.setAttribute('data-better-crunchyroll-upcoming', 'true');
      card.setAttribute('data-better-crunchyroll-episode-label', `Episode ${n}`);
      if (settings.hideUpcomingTitles) card.setAttribute('data-better-crunchyroll-hide-title', 'true');
    }
  }

  function findSkipButton(type) {
    const label = ({ intro:'Skip Intro', recap:'Skip Recap', credits:'Skip Credits' })[type];
    if (!label) return null;
    for (const selector of [`[aria-label="${label}"]`,`[title="${label}"]`,`button[data-t="${label.toLowerCase().replaceAll(' ','-')}"]`]) {
      const el = document.querySelector(selector);
      if (el && visible(el)) return el;
    }
    return null;
  }

  function skipActive() {
    for (const type of ['intro','recap','credits']) {
      const button = findSkipButton(type);
      if (button) { button.click(); return true; }
    }
    return false;
  }

  function autoSkip(type, enabledSetting) {
    if (!enabled || !enabledSetting) return;
    const button = findSkipButton(type);
    if (!button || autoSkipState.has(button)) return;
    autoSkipState.add(button);
    button.click();
  }

  function findEpisodeNavButton(direction) {
    const label = direction === 'next' ? 'Next Episode' : 'Previous Episode';
    for (const selector of [`button[aria-label="${label}"]`,`a[aria-label="${label}"]`,`button[title="${label}"]`,`a[title="${label}"]`,`button[data-testid="${direction}-episode"]`,`a[data-testid="${direction}-episode"]`]) {
      const el = document.querySelector(selector);
      if (el && visible(el)) return el;
    }
    return null;
  }

  function handleShortcut(event) {
    if (!enabled || event.repeat || isTyping(event.target) || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === settings.shortcuts.skip) { if (skipActive()) event.preventDefault(); }
    else if (event.code === settings.shortcuts.previous) { const btn=findEpisodeNavButton('previous'); if(btn){event.preventDefault();btn.click();} }
    else if (event.code === settings.shortcuts.next) { const btn=findEpisodeNavButton('next'); if(btn){event.preventDefault();btn.click();} }
  }

  function removeEnhancements() {
    removeStyles();
    document.querySelectorAll('[data-better-crunchyroll-upcoming],[data-better-crunchyroll-hide-title],[data-better-crunchyroll-episode-label]').forEach((el)=>{
      el.removeAttribute('data-better-crunchyroll-upcoming');
      el.removeAttribute('data-better-crunchyroll-hide-title');
      el.removeAttribute('data-better-crunchyroll-episode-label');
    });
    if (observer) { observer.disconnect(); observer=null; }
  }

  function refresh() {
    if (!enabled) return;
    injectStyles();
    updateSpoilerProtection();
    autoSkip('intro',settings.autoSkipIntro);
    autoSkip('recap',settings.autoSkipRecap);
    autoSkip('credits',settings.autoSkipCredits);
  }

  function setEnabled(next) {
    enabled=next!==false;
    if(!enabled){removeEnhancements();return;}
    injectStyles();
    if(!observer){observer=new MutationObserver(refresh);observer.observe(document.documentElement,{childList:true,subtree:true});}
    refresh();
  }

  async function loadSettings(){
    const stored=await chrome.storage.local.get({
      [STORAGE.enabled]:true,
      [STORAGE.shortcuts]:DEFAULTS.shortcuts,
      [STORAGE.autoSkipIntro]:DEFAULTS.autoSkipIntro,
      [STORAGE.autoSkipRecap]:DEFAULTS.autoSkipRecap,
      [STORAGE.autoSkipCredits]:DEFAULTS.autoSkipCredits,
      [STORAGE.blurUpcoming]:DEFAULTS.blurUpcoming,
      [STORAGE.hideUpcomingTitles]:DEFAULTS.hideUpcomingTitles,
    });
    settings={
      shortcuts:{...DEFAULTS.shortcuts,...(stored[STORAGE.shortcuts]||{})},
      autoSkipIntro:Boolean(stored[STORAGE.autoSkipIntro]),
      autoSkipRecap:Boolean(stored[STORAGE.autoSkipRecap]),
      autoSkipCredits:Boolean(stored[STORAGE.autoSkipCredits]),
      blurUpcoming:Boolean(stored[STORAGE.blurUpcoming]),
      hideUpcomingTitles:Boolean(stored[STORAGE.hideUpcomingTitles]),
    };
    setEnabled(stored[STORAGE.enabled]!==false);
  }

  document.addEventListener('keydown',handleShortcut,true);
  chrome.storage.onChanged.addListener((changes,areaName)=>{
    if(areaName!=='local')return;
    if(changes[STORAGE.enabled])setEnabled(changes[STORAGE.enabled].newValue!==false);
    if(changes[STORAGE.shortcuts]||changes[STORAGE.autoSkipIntro]||changes[STORAGE.autoSkipRecap]||changes[STORAGE.autoSkipCredits]||changes[STORAGE.blurUpcoming]||changes[STORAGE.hideUpcomingTitles])loadSettings();
  });
  loadSettings();
})();
