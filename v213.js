(() => {
  const OVERLAY_ID = 'better-crunchyroll-loading';
  const BACK_BUTTON_ID = 'better-crunchyroll-back';
  const ROUTE_EVENT = 'better-crunchyroll-locationchange';
  const MOVED_ATTR = 'data-better-crunchyroll-discover-moved';

  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function isDiscoverPage() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path === '/discover' || path === '/home';
  }

  function removeStuckLoadingOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    const video = document.querySelector('video');
    if (!overlay || !video) return;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || !video.paused || !video.ended) {
      overlay.remove();
    }
  }

  function fixBackButtonAppearance() {
    if (!document.getElementById(BACK_BUTTON_ID)) return;

    let style = document.getElementById('better-crunchyroll-213-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'better-crunchyroll-213-style';
      style.textContent = `
        #${BACK_BUTTON_ID} {
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        #${BACK_BUTTON_ID}:hover,
        #${BACK_BUTTON_ID}:focus-visible {
          background: #3f3f46 !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
      `;
      document.documentElement.appendChild(style);
    }
  }

  function watchVideoLoading() {
    const video = document.querySelector('video');
    if (!video || video.__betterCrunchyroll213LoadingHook) return;

    video.__betterCrunchyroll213LoadingHook = true;
    const finish = () => removeStuckLoadingOverlay();
    for (const event of ['loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'timeupdate', 'durationchange']) {
      video.addEventListener(event, finish, { passive: true });
    }
    finish();
  }

  function findDiscoverFeed(title) {
    const heading = Array.from(
      document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')
    ).find((element) => normalize(element.textContent) === normalize(title));

    if (!heading) return null;

    // The Discover page wraps each feed in a top-level data-id container.
    // Using the heading -> data-id relationship avoids depending on hashed
    // CSS-module class names such as container--cq5XE.
    return heading.closest('[data-id]') || heading.closest('section') || heading.parentElement;
  }

  function moveContinueWatching() {
    if (!isDiscoverPage()) return;

    const continueWatching = findDiscoverFeed('Continue Watching');
    const trending = findDiscoverFeed('Trending in Canada');
    if (!continueWatching || !trending || continueWatching === trending) return;

    const parent = trending.parentElement;
    if (!parent) return;

    if (continueWatching.parentElement === parent && continueWatching.previousElementSibling === trending) {
      continueWatching.setAttribute(MOVED_ATTR, 'true');
      return;
    }

    parent.insertBefore(continueWatching, trending.nextSibling);
    continueWatching.setAttribute(MOVED_ATTR, 'true');
  }

  function refresh() {
    fixBackButtonAppearance();
    watchVideoLoading();
    removeStuckLoadingOverlay();
    moveContinueWatching();
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener(ROUTE_EVENT, refresh);
  window.addEventListener('popstate', refresh);
  window.addEventListener('hashchange', refresh);

  refresh();
})();
