(() => {
  const OVERLAY_ID = 'better-crunchyroll-loading';
  const CONTINUE_WATCHING_CLASS = 'CQ5XE';
  const DISCOVER_MOVED_ATTR = 'data-better-crunchyroll-discover-moved';
  const ROUTE_EVENT = 'better-crunchyroll-locationchange';

  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function isDiscoverPage() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path === '/discover' || path === '/home';
  }

  function removeStuckLoadingOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    const video = document.querySelector('video');
    if (!overlay || !video) return;

    const readyToPlay = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const playing = !video.paused && !video.ended;

    if (readyToPlay || playing) {
      overlay.remove();
    }
  }

  function watchVideoLoading() {
    const video = document.querySelector('video');
    if (!video || video.__betterCrunchyroll213LoadingHook) return;

    video.__betterCrunchyroll213LoadingHook = true;
    const finish = () => removeStuckLoadingOverlay();
    for (const event of ['loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'timeupdate']) {
      video.addEventListener(event, finish, { passive: true });
    }
    finish();
  }

  function findTrendingSection() {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'));
    const heading = headings.find((element) => normalize(element.textContent) === 'trending in canada');
    if (!heading) return null;

    const section = heading.closest('section');
    if (section) return section;

    let current = heading;
    for (let depth = 0; depth < 6 && current.parentElement; depth += 1) {
      current = current.parentElement;
      if (current.children.length >= 2) return current;
    }
    return heading.parentElement;
  }

  function moveContinueWatching() {
    if (!isDiscoverPage()) return;

    const continueWatching = document.querySelector(`.${CONTINUE_WATCHING_CLASS}`);
    const trending = findTrendingSection();
    if (!continueWatching || !trending || continueWatching === trending) return;

    const parent = trending.parentElement;
    if (!parent) return;

    if (continueWatching.parentElement === parent && continueWatching.previousElementSibling === trending) {
      continueWatching.setAttribute(DISCOVER_MOVED_ATTR, 'true');
      return;
    }

    parent.insertBefore(continueWatching, trending.nextSibling);
    continueWatching.setAttribute(DISCOVER_MOVED_ATTR, 'true');
  }

  function refresh() {
    watchVideoLoading();
    removeStuckLoadingOverlay();
    moveContinueWatching();
  }

  const observer = new MutationObserver(() => refresh());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener(ROUTE_EVENT, refresh);
  window.addEventListener('popstate', refresh);
  window.addEventListener('hashchange', refresh);

  refresh();
})();
