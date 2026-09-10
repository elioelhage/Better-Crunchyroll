(() => {
  const STORAGE = 'betterCrunchyrollVideoQuality';
  const DEFAULT = 'auto';
  const FLAG = 'data-better-crunchyroll-v237-loaded';

  function injectPageHook() {
    if (document.documentElement.hasAttribute(FLAG)) return;
    document.documentElement.setAttribute(FLAG, 'true');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('v237-page.js');
    script.dataset.betterCrunchyroll = 'v237';
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function normalize(value) {
    if (value === 'auto' || value == null || value === '') return 'auto';
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? String(Math.round(n)) : DEFAULT;
  }

  function send(value) {
    const quality = normalize(value);
    window.postMessage({
      source: 'better-crunchyroll-v237',
      type: 'set-quality',
      quality: quality === 'auto' ? 0 : Number(quality),
    }, '*');
  }

  injectPageHook();

  chrome.storage.local.get({ [STORAGE]: DEFAULT }, (result) => send(result[STORAGE]));
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE]) send(changes[STORAGE].newValue);
  });
})();
