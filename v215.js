(() => {
  const TITLE_ID = 'better-crunchyroll-episode-title';
  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const LIST_STYLE_ID = 'better-crunchyroll-v215-episode-list-style';
  const CONTAINER_ATTR = 'data-better-crunchyroll-v215-list';
  const ITEM_ATTR = 'data-better-crunchyroll-v215-item';
  const THUMB_ATTR = 'data-better-crunchyroll-v215-thumb';
  const WATCHED_ATTR = 'data-better-crunchyroll-v215-watched';

  function injectPlayerTitleTweak() {
    if (document.getElementById('better-crunchyroll-v215-title-style')) return;
    const style = document.createElement('style');
    style.id = 'better-crunchyroll-v215-title-style';
    style.textContent = `
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
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && r.width > 0 && r.height > 0;
  }

  function findDialog() {
    let best = null;
    let bestScore = 0;
    for (const dialog of document.querySelectorAll('[role="dialog"], [aria-modal="true"]')) {
      if (!visible(dialog)) continue;
      const links = dialog.querySelectorAll('a[href*="/watch/"]');
      if (links.length < 3) continue;
      const score = links.length * 10 + ((dialog.textContent || '').match(/\bE\d+\b/gi) || []).length;
      if (score > bestScore) {
        best = dialog;
        bestScore = score;
      }
    }
    return best;
  }

  function episodeNumber(text) {
    const match = String(text || '').match(/\bE\s*(\d+)\b/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function findItem(link) {
    let current = link;
    let fallback = link.parentElement;
    for (let depth = 0; current && depth < 10; depth += 1) {
      if (current !== link && current.querySelectorAll('a[href*="/watch/"]').length === 1) {
        const cls = typeof current.className === 'string' ? current.className.toLowerCase() : '';
        if (current.querySelector('img') || /episode|card|item|tile|grid/.test(cls)) return current;
        fallback = current;
      }
      current = current.parentElement;
    }
    return fallback;
  }

  function markItem(item) {
    item.setAttribute(ITEM_ATTR, 'true');
    const classText = [
      typeof item.className === 'string' ? item.className : '',
      ...Array.from(item.querySelectorAll('[class]')).slice(0, 32).map((x) => typeof x.className === 'string' ? x.className : ''),
    ].join(' ').toLowerCase();
    const watched = /(?:^|[-_\s])(watched|completed|complete|played)(?:[-_\s]|$)/.test(classText)
      || /\bwatched\b/i.test(item.getAttribute('aria-label') || '')
      || /\bwatched\b/i.test(item.textContent || '');
    if (watched) item.setAttribute(WATCHED_ATTR, 'true');
    else item.removeAttribute(WATCHED_ATTR);

    const image = item.querySelector('img');
    if (!image) return;
    let thumb = image;
    while (thumb.parentElement && thumb.parentElement !== item) thumb = thumb.parentElement;
    if (thumb.parentElement === item) thumb.setAttribute(THUMB_ATTR, 'true');
  }

  function ensureStyles() {
    if (document.getElementById(LIST_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = LIST_STYLE_ID;
    style.textContent = `
      [${CONTAINER_ATTR}="true"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-height: min(72vh, 760px) !important;
        min-height: 0 !important;
        padding: 4px 12px 12px 0 !important;
        scrollbar-gutter: stable;
      }
      [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] {
        display: grid !important;
        grid-template-columns: minmax(150px, 220px) minmax(0, 1fr) !important;
        align-items: center !important;
        column-gap: 18px !important;
        width: 100% !important;
        min-width: 0 !important;
        min-height: 102px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] > [${THUMB_ATTR}="true"] {
        grid-column: 1 !important;
        grid-row: 1 / -1 !important;
        width: 100% !important;
        max-width: 220px !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] > *:not([${THUMB_ATTR}="true"]) {
        grid-column: 2 !important;
        min-width: 0 !important;
      }
      [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] img {
        width: 100% !important;
        aspect-ratio: 16 / 9 !important;
        height: auto !important;
        max-height: 124px !important;
        object-fit: cover !important;
        border-radius: 2px !important;
      }
      [${WATCHED_ATTR}="true"] { opacity: 0.48 !important; }
      [${WATCHED_ATTR}="true"]:hover, [${WATCHED_ATTR}="true"]:focus-within { opacity: 0.72 !important; }
      [${ITEM_ATTR}="true"] a { min-width: 0 !important; }
      @media (max-width: 700px) {
        [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] {
          grid-template-columns: 140px minmax(0, 1fr) !important;
          column-gap: 12px !important;
          min-height: 82px !important;
        }
        [${CONTAINER_ATTR}="true"] > [${ITEM_ATTR}="true"] img { max-height: 90px !important; }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function findItems(dialog) {
    const links = Array.from(dialog.querySelectorAll('a[href*="/watch/"]'));
    const items = [];
    const seen = new Set();
    for (const link of links) {
      const item = findItem(link);
      if (!item || seen.has(item)) continue;
      seen.add(item);
      items.push(item);
    }
    return items;
  }

  function findContainer(items) {
    if (!items.length) return null;
    const set = new Set(items);
    let candidate = items[0].parentElement;
    for (let depth = 0; candidate && depth < 8; depth += 1) {
      const direct = Array.from(candidate.children).filter((x) => set.has(x));
      if (direct.length >= Math.min(3, items.length)) return candidate;
      candidate = candidate.parentElement;
    }
    return null;
  }

  function currentEpisode() {
    const title = document.getElementById(TITLE_ID)?.textContent || document.title;
    return episodeNumber(title);
  }

  function applyList() {
    const dialog = findDialog();
    if (!dialog) return false;
    const items = findItems(dialog);
    if (items.length < 3) return false;
    const container = findContainer(items);
    if (!container) return false;
    const directItems = items.filter((x) => x.parentElement === container);
    if (directItems.length < 3) return false;

    ensureStyles();
    directItems.forEach(markItem);
    directItems.sort((a, b) => episodeNumber(a.textContent) - episodeNumber(b.textContent));
    directItems.forEach((item) => container.appendChild(item));
    container.setAttribute(CONTAINER_ATTR, 'true');

    const targetNumber = currentEpisode();
    if (Number.isFinite(targetNumber)) {
      let target = null;
      for (const item of directItems) {
        if (episodeNumber(item.textContent) === targetNumber) { target = item; break; }
      }
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }));
    }
    return true;
  }

  function observeDialog(dialog) {
    if (!dialog || dialog.__betterCrunchyrollV215Observer) return;
    const observer = new MutationObserver(() => applyList());
    dialog.__betterCrunchyrollV215Observer = observer;
    observer.observe(dialog, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      delete dialog.__betterCrunchyrollV215Observer;
    }, 5000);
  }

  function enhanceAfterOpen() {
    for (const delay of [0, 60, 160, 350, 700, 1200]) {
      setTimeout(() => {
        const dialog = findDialog();
        if (dialog) {
          applyList();
          observeDialog(dialog);
        }
      }, delay);
    }
  }

  injectPlayerTitleTweak();
  const start = () => injectPlayerTitleTweak();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.(`#${EPISODE_BUTTON_ID}`);
    if (button) enhanceAfterOpen();
  }, true);
})();
