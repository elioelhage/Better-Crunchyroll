const STORAGE_KEY = 'betterCrunchyrollEnabled';
const VERSION = '0.2.58';
const SKIP_EVENTS_BASE = 'https://static.crunchyroll.com/skip-events/production/';

async function syncBadge() {
  const stored = await chrome.storage.local.get({ [STORAGE_KEY]: true });
  const enabled = stored[STORAGE_KEY] !== false;
  await chrome.action.setIcon({ path: {
    16: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
    32: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
    48: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
    128: enabled ? 'icons/icon128.png' : 'icons/icon128-off.png',
  }});
}

async function fetchSkipEvents(mediaId) {
  const response = await fetch(`${SKIP_EVENTS_BASE}${encodeURIComponent(mediaId)}.json`);
  if (response.status === 404 || response.status === 403) return [];
  if (!response.ok) throw new Error(`Skip events request failed: ${response.status}`);
  const data = await response.json();
  return Object.entries(data || {}).reduce((events, [type, segment]) => {
    if (typeof segment?.start === 'number' && typeof segment?.end === 'number') events.push({ type, start: segment.start, end: segment.end });
    return events;
  }, []);
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!(STORAGE_KEY in stored)) await chrome.storage.local.set({ [STORAGE_KEY]: true });
  await chrome.storage.local.remove('betterCrunchyrollPipWindow');
  await syncBadge();
});
chrome.runtime.onStartup.addListener(syncBadge);
chrome.storage.onChanged.addListener((changes, areaName) => { if (areaName === 'local' && changes[STORAGE_KEY]) syncBadge(); });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender?.tab?.id;
  if (message?.type === 'betterCrunchyrollEpisodeZoom') {
    if (typeof tabId !== 'number') { sendResponse({ ok: false }); return true; }
    if (message.action === 'prepare') {
      chrome.tabs.getZoom(tabId).then((originalZoom) => {
        const requested = Number(message.zoomFactor);
        const targetZoom = Math.min(Number(originalZoom) || 1, Number.isFinite(requested) && requested > 0 ? requested : 0.8);
        if (Math.abs(targetZoom - originalZoom) < 0.001) return { originalZoom, targetZoom };
        return chrome.tabs.setZoom(tabId, targetZoom).then(() => new Promise((resolve) => setTimeout(() => resolve({ originalZoom, targetZoom }), 140)));
      }).then(({ originalZoom, targetZoom }) => sendResponse({ ok: true, originalZoom, targetZoom })).catch(() => sendResponse({ ok: false }));
      return true;
    }
    if (message.action === 'restore') {
      const restoreZoom = Number(message.originalZoom);
      if (!Number.isFinite(restoreZoom) || restoreZoom <= 0) { sendResponse({ ok: false }); return true; }
      chrome.tabs.setZoom(tabId, restoreZoom).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      return true;
    }
    sendResponse({ ok: false }); return true;
  }

  if (message?.type === 'betterCrunchyrollSkipEvents') {
    if (!message.mediaId) { sendResponse([]); return true; }
    fetchSkipEvents(message.mediaId).then(sendResponse).catch(() => sendResponse(null));
    return true;
  }

  if (message?.type === 'PING') {
    chrome.storage.local.get({ [STORAGE_KEY]: true }).then((stored) => sendResponse({
      message: `Better Crunchyroll ${VERSION} is active.`,
      version: VERSION,
      enabled: stored[STORAGE_KEY] !== false,
    }));
    return true;
  }
  return false;
});