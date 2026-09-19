(() => {
  'use strict';

  const STORAGE = {
    enabled: 'betterCrunchyrollEnabled',
    preview: 'betterCrunchyrollNextEpisodePreview',
    blurUpcoming: 'betterCrunchyrollBlurUpcoming',
    hideUpcomingTitles: 'betterCrunchyrollHideUpcomingTitles',
  };

  const NEXT_SELECTOR = '[data-testid="next-episode-button"]';
  const CARD_ID = 'better-crunchyroll-next-preview';
  const STYLE_ID = 'better-crunchyroll-next-preview-style';

  let settings = {
    enabled: true,
    preview: true,
    blurUpcoming: false,
    hideUpcomingTitles: false,
  };
  let card = null;
  let activeButton = null;
  let showTimer = null;
  let hideTimer = null;

  const watchIdOf = (href) => {
    const match = String(href || '').match(/\/watch\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  };

  function nextHrefOf(button) {
    const link = button.closest('a[href*="/watch/"]') || button.querySelector('a[href*="/watch/"]');
    return link?.getAttribute('href') || null;
  }

  function pickNextEpisode(episodes, nextId) {
    if (!Array.isArray(episodes) || !episodes.length) return null;
    if (nextId) return episodes.find((ep) => watchIdOf(ep.href) === nextId) || null;

    const current = episodes.find((ep) => ep.current);
    if (!current) return null;
    const currentNumber = Number(current.episodeNumber);
    if (!Number.isFinite(currentNumber)) return null;

    return episodes
      .filter((ep) => Number.isFinite(Number(ep.episodeNumber)) && Number(ep.episodeNumber) > currentNumber)
      .sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber))[0] || null;
  }

  function resolvePreview(button) {
    let episode = null;
    try {
      episode = window.betterCrunchyrollGetNextEpisode?.() || null;
    } catch {}

    if (!episode) {
      let episodes = [];
      try {
        episodes = window.betterCrunchyrollGetEpisodes?.()?.episodes || [];
      } catch {}
      episode = pickNextEpisode(episodes, watchIdOf(nextHrefOf(button)));
    }

    if (!episode) return null;

    const spoiler = !episode.watched;
    return {
      label: spoiler && settings.hideUpcomingTitles
        ? 'Hidden Title'
        : `E${episode.episodeNumber} - ${episode.title}`,
      thumbnail: episode.thumbnail || '',
      duration: episode.duration || '',
    };
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CARD_ID} {
        position: fixed;
        z-index: 2147483646;
        width: 256px;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 8px;
        background: #18181c;
        color: #fff;
        box-shadow: 0 12px 36px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.08);
        font-family: DMSans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(6px);
        transition: opacity 140ms ease, transform 160ms ease, visibility 0s linear 160ms;
      }
      #${CARD_ID}.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition-delay: 0s;
      }
      #${CARD_ID} .thumb {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        background: #111;
      }
      #${CARD_ID} .thumb img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      #${CARD_ID} .duration {
        position: absolute;
        right: 6px;
        bottom: 6px;
        padding: 2px 5px;
        border-radius: 4px;
        background: rgba(0,0,0,.78);
        font: 700 11px/1 system-ui, sans-serif;
      }
      #${CARD_ID} .copy { padding: 10px 12px 12px; }
      #${CARD_ID} .eyebrow {
        margin-bottom: 4px;
        color: #ff5e00;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      #${CARD_ID} .title {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.3;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureCard() {
    ensureStyle();
    if (!card || !card.isConnected) {
      card = document.createElement('div');
      card.id = CARD_ID;
      card.setAttribute('aria-hidden', 'true');
      (document.body || document.documentElement).appendChild(card);
    }
    return card;
  }

  function positionCard(button) {
    if (!card) return;
    const rect = button.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - width / 2),
      Math.max(12, window.innerWidth - width - 12)
    );
    const top = Math.max(12, rect.top - 12 - height);
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }

  function fillCard(preview) {
    const el = ensureCard();
    el.innerHTML = '';

    if (preview.thumbnail) {
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.src = preview.thumbnail;
      thumb.appendChild(img);

      if (preview.duration) {
        const duration = document.createElement('div');
        duration.className = 'duration';
        duration.textContent = preview.duration;
        thumb.appendChild(duration);
      }
      el.appendChild(thumb);
    }

    const copy = document.createElement('div');
    copy.className = 'copy';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Next episode';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = preview.label;

    copy.append(eyebrow, title);
    el.appendChild(copy);
  }

  function hide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = null;
    hideTimer = null;
    activeButton = null;
    card?.classList.remove('visible');
  }

  function show(button) {
    if (!settings.enabled || !settings.preview || !button.isConnected) return;
    if (!button.matches(':hover') && !button.matches(':focus-visible')) return;

    const preview = resolvePreview(button);
    if (!preview) return;

    activeButton = button;
    fillCard(preview);
    positionCard(button);
    card.classList.add('visible');
  }

  function scheduleShow(button) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => show(button), 140);
  }

  function scheduleHide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 70);
  }

  const buttonFrom = (event) =>
    event.target instanceof Element ? event.target.closest(NEXT_SELECTOR) : null;

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const button = buttonFrom(event);
    if (button) scheduleShow(button);
  }, true);

  document.addEventListener('pointerout', (event) => {
    const button = buttonFrom(event);
    if (!button || (event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) return;
    scheduleHide();
  }, true);

  document.addEventListener('focusin', (event) => {
    const button = buttonFrom(event);
    if (button && button.matches(':focus-visible')) scheduleShow(button);
  }, true);

  document.addEventListener('focusout', (event) => {
    if (buttonFrom(event)) scheduleHide();
  }, true);

  document.addEventListener('click', (event) => {
    if (buttonFrom(event)) hide();
  }, true);

  window.addEventListener('resize', () => {
    if (activeButton) positionCard(activeButton);
  }, { passive: true });

  window.addEventListener('better-crunchyroll-locationchange', hide);
  window.addEventListener('popstate', hide);

  function applySettings(stored) {
    settings = {
      enabled: stored[STORAGE.enabled] !== false,
      preview: stored[STORAGE.preview] !== false,
      blurUpcoming: Boolean(stored[STORAGE.blurUpcoming]),
      hideUpcomingTitles: Boolean(stored[STORAGE.hideUpcomingTitles]),
    };
    if (!settings.enabled || !settings.preview) hide();
  }

  const DEFAULTS = {
    [STORAGE.enabled]: true,
    [STORAGE.preview]: true,
    [STORAGE.blurUpcoming]: false,
    [STORAGE.hideUpcomingTitles]: false,
  };

  chrome.storage.local.get(DEFAULTS, applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !Object.values(STORAGE).some((key) => changes[key])) return;
    chrome.storage.local.get(DEFAULTS, applySettings);
  });
})();