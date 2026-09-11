(() => {
  const STYLE_ID = 'better-crunchyroll-v238-episode-list-style';
  const ENABLED_KEY = 'betterCrunchyrollEnabled';

  let enabled = true;
  let raf = 0;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* v2.38: stabilize the episode-list modal on desktop-sized viewports. */
      @media (min-width: 1000px) {
        .erc-episode-list-modal {
          display: flex !important;
          flex-direction: column !important;
          width: min(94vw, 1280px) !important;
          max-width: min(94vw, 1280px) !important;
          height: min(90vh, 900px) !important;
          max-height: min(90vh, 900px) !important;
          min-height: 0 !important;
          box-sizing: border-box !important;
        }

        .erc-episode-list-modal .scrollable-section,
        .erc-episode-list-modal .content-wrapper--MF5LS.episode-list-content {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }

        .erc-episode-list-modal .erc-playable-collection.state-dt-condensed {
          display: flex !important;
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          align-items: stretch !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: min-content !important;
          box-sizing: border-box !important;
        }

        .erc-episode-list-modal .erc-playable-collection.state-dt-condensed > .card {
          flex: 0 0 auto !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
      }

      @media (min-width: 1600px) {
        .erc-episode-list-modal {
          width: min(92vw, 1360px) !important;
          max-width: min(92vw, 1360px) !important;
          height: min(90vh, 940px) !important;
          max-height: min(90vh, 940px) !important;
        }
      }

      @media (min-width: 2000px) {
        .erc-episode-list-modal {
          width: min(88vw, 1500px) !important;
          max-width: min(88vw, 1500px) !important;
          height: min(90vh, 1000px) !important;
          max-height: min(90vh, 1000px) !important;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function refresh() {
    raf = 0;
    if (!enabled) return;

    injectStyle();

    const modal = document.querySelector('.erc-episode-list-modal');
    if (!(modal instanceof HTMLElement)) return;

    const scroller = modal.querySelector(
      '.scrollable-section, .content-wrapper--MF5LS.episode-list-content'
    );
    if (!(scroller instanceof HTMLElement)) return;

    const collection = modal.querySelector('.erc-playable-collection.state-dt-condensed');
    if (collection instanceof HTMLElement) {
      collection.style.setProperty('display', 'flex', 'important');
      collection.style.setProperty('flex-direction', 'column', 'important');
      collection.style.setProperty('flex-wrap', 'nowrap', 'important');
      collection.style.setProperty('align-items', 'stretch', 'important');
      collection.style.setProperty('width', '100%', 'important');
      collection.style.setProperty('max-width', '100%', 'important');
      collection.style.setProperty('min-width', '0', 'important');
      collection.style.setProperty('height', 'auto', 'important');
    }

    scroller.style.setProperty('flex', '1 1 auto', 'important');
    scroller.style.setProperty('min-height', '0', 'important');
    scroller.style.setProperty('width', '100%', 'important');
    scroller.style.setProperty('max-width', '100%', 'important');
    scroller.style.setProperty('overflow-y', 'auto', 'important');
    scroller.style.setProperty('overflow-x', 'hidden', 'important');
  }

  function scheduleRefresh() {
    if (raf) return;
    raf = requestAnimationFrame(refresh);
  }

  function setEnabled(next) {
    enabled = next !== false;
    if (!enabled) {
      removeStyle();
      return;
    }
    injectStyle();
    scheduleRefresh();
  }

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', scheduleRefresh, { passive: true });
  window.addEventListener('orientationchange', scheduleRefresh, { passive: true });

  chrome.storage.local.get({ [ENABLED_KEY]: true }).then((stored) => {
    setEnabled(stored[ENABLED_KEY] !== false);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[ENABLED_KEY]) return;
    setEnabled(changes[ENABLED_KEY].newValue !== false);
  });

  injectStyle();
  scheduleRefresh();
})();
