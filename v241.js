(() => {
  'use strict';

  const EPISODE_BUTTON_ID = 'better-crunchyroll-episode-list';
  const EPISODE_DIALOG_SELECTORS = [
    '.erc-episode-list-modal',
    '[role="dialog"]',
  ];

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function isVisible(element) {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }

  function isEpisodeDialogOpen() {
    const nativeModal = Array.from(document.querySelectorAll(EPISODE_DIALOG_SELECTORS[0]))
      .some(isVisible);
    if (nativeModal) return true;

    return Array.from(document.querySelectorAll(EPISODE_DIALOG_SELECTORS[1]))
      .filter(isVisible)
      .some((dialog) => {
        const links = dialog.querySelectorAll('a[href*="/watch/"]');
        const text = `${dialog.getAttribute('aria-label') || ''} ${dialog.textContent || ''}`
          .replace(/\s+/g, ' ')
          .toLowerCase();
        return links.length >= 3 && /episode|season/.test(text);
      });
  }

  function findEpisodeTrigger() {
    return document.querySelector('[data-t="see-more-episodes-btn"]')
      || document.querySelector('button.see-all-button')
      || Array.from(document.querySelectorAll('button, a, [role="button"]')).find((element) => {
        const text = [
          element.getAttribute('aria-label') || '',
          element.getAttribute('title') || '',
          element.textContent || '',
        ].join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
        return element.id !== EPISODE_BUTTON_ID && /(see all|more)\s+episodes/.test(text);
      })
      || null;
  }

  function fullClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };

    for (const [Ctor, type] of [
      [window.PointerEvent || window.MouseEvent, 'pointerdown'],
      [MouseEvent, 'mousedown'],
      [window.PointerEvent || window.MouseEvent, 'pointerup'],
      [MouseEvent, 'mouseup'],
      [MouseEvent, 'click'],
    ]) {
      try { element.dispatchEvent(new Ctor(type, base)); } catch { /* ignore */ }
    }

    try { element.click(); } catch { /* ignore */ }
  }

  async function waitForEpisodeDialog(timeoutMs) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (isEpisodeDialogOpen()) return true;
      await wait(45);
    }
    return isEpisodeDialogOpen();
  }

  function backgroundMessage(type, payload = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...payload }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false });
          return;
        }
        resolve(response || { ok: false });
      });
    });
  }

  let responsiveSpoofActive = false;
  let zoomActive = false;
  let originalZoom = null;
  let closeObserver = null;
  let closeTimeout = null;

  function clearCloseWatchers() {
    closeObserver?.disconnect();
    closeObserver = null;
    if (closeTimeout) clearTimeout(closeTimeout);
    closeTimeout = null;
  }

  async function restoreEpisodeEnvironment(force = false) {
    if (!force && isEpisodeDialogOpen()) return;
    clearCloseWatchers();

    if (responsiveSpoofActive) {
      responsiveSpoofActive = false;
      await backgroundMessage('betterCrunchyrollEpisodeResponsiveSpoof', { action: 'restore', scale: 0.8 });
    }

    if (zoomActive) {
      zoomActive = false;
      await backgroundMessage('betterCrunchyrollEpisodeZoom', { action: 'restore', originalZoom });
      originalZoom = null;
    }
  }

  function watchEpisodeEnvironment() {
    clearCloseWatchers();
    closeObserver = new MutationObserver(() => {
      if (!isEpisodeDialogOpen()) restoreEpisodeEnvironment();
    });
    closeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
    });
    closeTimeout = setTimeout(() => {
      if (!isEpisodeDialogOpen()) restoreEpisodeEnvironment(true);
    }, 6000);
  }

  async function openEpisodes() {
    if (isEpisodeDialogOpen() || responsiveSpoofActive || zoomActive) return;

    let trigger = findEpisodeTrigger();
    if (!trigger) return;

    // Preferred path: do exactly what Crunchyroll normally expects.
    fullClick(trigger);
    if (await waitForEpisodeDialog(450)) return;

    // Fallback #1: change only the responsive information Crunchyroll's JS
    // sees. The user's visible browser zoom remains untouched.
    const spoof = await backgroundMessage('betterCrunchyrollEpisodeResponsiveSpoof', {
      action: 'prepare',
      scale: 0.8,
    });

    if (spoof?.ok) {
      responsiveSpoofActive = true;
      await wait(90);
      trigger = findEpisodeTrigger() || trigger;
      fullClick(trigger);

      if (await waitForEpisodeDialog(900)) {
        watchEpisodeEnvironment();
        return;
      }

      await restoreEpisodeEnvironment(true);
    }

    // Fallback #2: the proven real 80% tab-zoom method. This is only reached
    // when normal opening and invisible responsive spoofing both fail.
    const prepared = await backgroundMessage('betterCrunchyrollEpisodeZoom', {
      action: 'prepare',
      zoomFactor: 0.8,
    });

    if (prepared?.ok) {
      zoomActive = true;
      originalZoom = Number(prepared.originalZoom) || 1;
      await wait(150);
      trigger = findEpisodeTrigger() || trigger;
      fullClick(trigger);

      if (await waitForEpisodeDialog(900)) {
        watchEpisodeEnvironment();
        return;
      }

      await restoreEpisodeEnvironment(true);
    }
  }

  // Keep the title anchored to the player's true center. The older layout
  // module calculates a center between the left/right controls, which moves
  // slightly whenever the playback timer changes width.
  function stabilizeEpisodeTitle() {
    const title = document.getElementById('better-crunchyroll-episode-title');
    if (!(title instanceof HTMLElement)) return;
    if (title.style.left !== '50%') {
      title.style.setProperty('left', '50%', 'important');
    }
  }

  const titleObserver = new MutationObserver(stabilizeEpisodeTitle);
  titleObserver.observe(document.documentElement, { childList: true, subtree: true });
  titleObserver.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style'],
  });
  window.addEventListener('resize', stabilizeEpisodeTitle, { passive: true });
  document.addEventListener('fullscreenchange', stabilizeEpisodeTitle);
  stabilizeEpisodeTitle();

  // Capture before the existing button's bubble-phase handler so 2.41 owns
  // the complete normal/fallback sequence.
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest(`#${EPISODE_BUTTON_ID}`)
      : null;
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    void openEpisodes();
  }, true);
})();
