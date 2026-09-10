(() => {
  const STYLE_ID = 'better-crunchyroll-v237-title-style';
  const TITLE_ID = 'better-crunchyroll-episode-title';
  const ENABLED_KEY = 'betterCrunchyrollEnabled';

  let enabled = true;
  let raf = 0;
  let observer = null;
  let resizeObserver = null;
  let observedShell = null;
  let observedLeft = null;
  let observedRight = null;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${TITLE_ID} {
        color: #ffffff !important;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        font-size: clamp(14px, 1.05vw, 20px) !important;
        font-weight: 650 !important;
        line-height: 1.25 !important;
        letter-spacing: -0.01em !important;
        text-align: center !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.72), 0 3px 10px rgba(0, 0, 0, 0.42) !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 4 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      @media (max-width: 700px) {
        #${TITLE_ID} {
          font-size: clamp(13px, 2.7vw, 17px) !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function positionTitle() {
    raf = 0;
    if (!enabled) return;
    const title = document.getElementById(TITLE_ID);
    if (!(title instanceof HTMLElement)) return;

    const shell = title.parentElement;
    if (!(shell instanceof HTMLElement)) return;

    const left = shell.querySelector('[data-testid="bottom-left-controls-stack"]');
    const right = shell.querySelector('[data-testid="bottom-right-controls-stack"]');
    if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return;

    const shellRect = shell.getBoundingClientRect();
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    if (shellRect.width <= 0 || shellRect.height <= 0) return;

    const available = rightRect.left - leftRect.right;
    if (available < 180) {
      title.style.setProperty('display', 'none', 'important');
      return;
    }

    const center = ((leftRect.right + rightRect.left) / 2) - shellRect.left;
    const controlTop = Math.min(leftRect.top, rightRect.top);
    const bottom = Math.max(58, shellRect.bottom - controlTop + 12);
    const maxWidth = Math.max(160, Math.min(820, available - 28));

    title.style.setProperty('display', 'block', 'important');
    title.style.setProperty('left', `${center}px`, 'important');
    title.style.setProperty('bottom', `${bottom}px`, 'important');
    title.style.setProperty('max-width', `${maxWidth}px`, 'important');
    title.style.setProperty('transform', 'translateX(-50%)', 'important');
  }

  function schedulePosition() {
    if (raf) return;
    raf = requestAnimationFrame(positionTitle);
  }

  function watchLayout() {
    const title = document.getElementById(TITLE_ID);
    const shell = title?.parentElement;
    const left = shell?.querySelector?.('[data-testid="bottom-left-controls-stack"]');
    const right = shell?.querySelector?.('[data-testid="bottom-right-controls-stack"]');

    if (shell === observedShell && left === observedLeft && right === observedRight) {
      schedulePosition();
      return;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;
    observedShell = shell instanceof HTMLElement ? shell : null;
    observedLeft = left instanceof HTMLElement ? left : null;
    observedRight = right instanceof HTMLElement ? right : null;

    if (observedShell) {
      resizeObserver = new ResizeObserver(schedulePosition);
      resizeObserver.observe(observedShell);
      if (observedLeft) resizeObserver.observe(observedLeft);
      if (observedRight) resizeObserver.observe(observedRight);
    }

    schedulePosition();
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) {
      const title = document.getElementById(TITLE_ID);
      if (title instanceof HTMLElement) {
        for (const prop of ['display', 'left', 'bottom', 'max-width', 'transform']) {
          title.style.removeProperty(prop);
        }
      }
      resizeObserver?.disconnect();
      resizeObserver = null;
      observedShell = null;
      observedLeft = null;
      observedRight = null;
      removeStyle();
      return;
    }
    injectStyle();
    watchLayout();
  }

  observer = new MutationObserver(() => {
    if (!enabled) return;
    const title = document.getElementById(TITLE_ID);
    if (title instanceof HTMLElement) {
      injectStyle();
      watchLayout();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', schedulePosition, { passive: true });
  window.addEventListener('orientationchange', schedulePosition, { passive: true });
  document.addEventListener('mousemove', schedulePosition, { passive: true });
  document.addEventListener('keydown', schedulePosition, { passive: true });

  chrome.storage.local.get({ [ENABLED_KEY]: true }).then((stored) => {
    setEnabled(stored[ENABLED_KEY] !== false);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[ENABLED_KEY]) return;
    setEnabled(changes[ENABLED_KEY].newValue !== false);
  });

  injectStyle();
  schedulePosition();
})();
