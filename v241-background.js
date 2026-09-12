const STORAGE_KEY = 'betterCrunchyrollEnabled';
const VERSION = '0.2.41';
const SKIP_EVENTS_BASE = 'https://static.crunchyroll.com/skip-events/production/';

async function syncBadge() {
  const stored = await chrome.storage.local.get({ [STORAGE_KEY]: true });
  const enabled = stored[STORAGE_KEY] !== false;
  await chrome.action.setIcon({
    path: {
      16: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
      32: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
      48: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
      128: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
    },
  });
}

async function fetchSkipEvents(mediaId) {
  const response = await fetch(`${SKIP_EVENTS_BASE}${encodeURIComponent(mediaId)}.json`);
  if (!response.ok) throw new Error(`Skip events request failed: ${response.status}`);
  const data = await response.json();
  return Object.entries(data || {}).reduce((events, [type, segment]) => {
    if (typeof segment?.start === 'number' && typeof segment?.end === 'number') {
      events.push({ type, start: segment.start, end: segment.end });
    }
    return events;
  }, []);
}

function responsiveSpoofMainWorld(enabled, scale = 0.8) {
  const FLAG = '__betterCrunchyrollEpisodeResponsiveSpoof';

  if (!enabled) {
    const state = window[FLAG];
    if (!state?.originals) return { ok: true };
    for (let i = state.originals.length - 1; i >= 0; i -= 1) {
      const entry = state.originals[i];
      try { Object.defineProperty(entry.target, entry.key, entry.descriptor); } catch { /* ignore */ }
    }
    try { delete window[FLAG]; } catch { window[FLAG] = null; }
    try { window.dispatchEvent(new Event('resize')); } catch { /* ignore */ }
    return { ok: true };
  }

  if (window[FLAG]?.active) return { ok: true, alreadyActive: true };

  const factor = Number.isFinite(Number(scale)) && Number(scale) > 0 && Number(scale) < 1
    ? Number(scale)
    : 0.8;
  const originals = [];

  function define(target, key, descriptor) {
    const current = Object.getOwnPropertyDescriptor(target, key);
    if (!current?.configurable) return false;
    originals.push({ target, key, descriptor: current });
    Object.defineProperty(target, key, descriptor);
    return true;
  }

  const realWidth = Number(window.innerWidth) || 1;
  const realHeight = Number(window.innerHeight) || 1;
  const realOuterWidth = Number(window.outerWidth) || realWidth;
  const realOuterHeight = Number(window.outerHeight) || realHeight;
  const realDpr = Number(window.devicePixelRatio) || 1;

  define(window, 'innerWidth', { configurable: true, enumerable: true, get: () => Math.round(realWidth / factor) });
  define(window, 'innerHeight', { configurable: true, enumerable: true, get: () => Math.round(realHeight / factor) });
  define(window, 'outerWidth', { configurable: true, enumerable: true, get: () => Math.round(realOuterWidth / factor) });
  define(window, 'outerHeight', { configurable: true, enumerable: true, get: () => Math.round(realOuterHeight / factor) });
  define(window, 'devicePixelRatio', { configurable: true, enumerable: true, get: () => realDpr * factor });

  const nativeMatchMedia = window.matchMedia.bind(window);
  define(window, 'matchMedia', {
    configurable: true,
    enumerable: true,
    writable: true,
    value(query) {
      const rewritten = String(query).replace(
        /((?:min|max)-width\s*:\s*)([-+]?\d+(?:\.\d+)?)px/gi,
        (_, prefix, value) => `${prefix}${Number(value) * factor}px`,
      );
      return nativeMatchMedia(rewritten);
    },
  });

  const visualViewport = window.visualViewport;
  if (visualViewport) {
    const proto = Object.getPrototypeOf(visualViewport);
    for (const key of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (descriptor?.configurable && typeof descriptor.get === 'function') {
        const real = Number(descriptor.get.call(visualViewport)) || (key === 'width' ? realWidth : realHeight);
        define(proto, key, {
          configurable: true,
          enumerable: descriptor.enumerable,
          get: () => Math.round(real / factor),
        });
      }
    }
  }

  window[FLAG] = { active: true, originals };
  try { window.dispatchEvent(new Event('resize')); } catch { /* ignore */ }
  return { ok: true };
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!(STORAGE_KEY in stored)) await chrome.storage.local.set({ [STORAGE_KEY]: true });
  await syncBadge();
});

chrome.runtime.onStartup.addListener(syncBadge);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) syncBadge();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender?.tab?.id;

  if (message?.type === 'betterCrunchyrollEpisodeResponsiveSpoof') {
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false });
      return true;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: responsiveSpoofMainWorld,
      args: [message.action === 'prepare', Number(message.scale) || 0.8],
    }).then((results) => {
      sendResponse(results?.[0]?.result || { ok: false });
    }).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === 'betterCrunchyrollEpisodeZoom') {
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false });
      return true;
    }

    if (message.action === 'prepare') {
      chrome.tabs.getZoom(tabId).then((originalZoom) => {
        const requested = Number(message.zoomFactor);
        const targetZoom = Math.min(Number(originalZoom) || 1, Number.isFinite(requested) && requested > 0 ? requested : 0.8);
        if (Math.abs(targetZoom - originalZoom) < 0.001) return { originalZoom, targetZoom };
        return chrome.tabs.setZoom(tabId, targetZoom).then(() => new Promise((resolve) => {
          setTimeout(() => resolve({ originalZoom, targetZoom }), 140);
        }));
      }).then(({ originalZoom, targetZoom }) => {
        sendResponse({ ok: true, originalZoom, targetZoom });
      }).catch(() => sendResponse({ ok: false }));
      return true;
    }

    if (message.action === 'restore') {
      const restoreZoom = Number(message.originalZoom);
      if (!Number.isFinite(restoreZoom) || restoreZoom <= 0) {
        sendResponse({ ok: false });
        return true;
      }
      chrome.tabs.setZoom(tabId, restoreZoom)
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }

    sendResponse({ ok: false });
    return true;
  }

  if (message?.type === 'betterCrunchyrollSkipEvents') {
    if (!message.mediaId) {
      sendResponse([]);
      return true;
    }
    fetchSkipEvents(message.mediaId).then(sendResponse).catch(() => sendResponse([]));
    return true;
  }

  if (message?.type === 'PING') {
    chrome.storage.local.get({ [STORAGE_KEY]: true }).then((stored) => {
      sendResponse({
        message: `Better Crunchyroll ${VERSION} is active.`,
        version: VERSION,
        enabled: stored[STORAGE_KEY] !== false,
      });
    });
    return true;
  }

  return false;
});
