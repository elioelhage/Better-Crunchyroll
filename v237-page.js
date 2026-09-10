(() => {
  if (window.__betterCrunchyrollV237QualityHook) return;
  window.__betterCrunchyrollV237QualityHook = true;

  let desiredHeight = 0;

  function parseQuality(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }

  function setQuality(value) {
    desiredHeight = parseQuality(value);
  }

  function getHeight(attributes) {
    const match = String(attributes || '').match(/(?:^|,)RESOLUTION=(?:\"?)(\d+)x(\d+)(?:\"?)(?:,|$)/i);
    return match ? Number(match[2]) : 0;
  }

  function rewriteMasterPlaylist(text) {
    if (!desiredHeight || !text.includes('#EXT-X-STREAM-INF:')) return text;

    const lines = text.split(/\r?\n/);
    const variants = [];

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXT-X-STREAM-INF:')) continue;
      const height = getHeight(lines[i].slice('#EXT-X-STREAM-INF:'.length));
      let uriIndex = i + 1;
      while (uriIndex < lines.length && lines[uriIndex] === '') uriIndex++;
      if (uriIndex >= lines.length || lines[uriIndex].startsWith('#')) continue;
      variants.push({ start: i, end: uriIndex, height });
    }

    const available = [...new Set(variants.map((v) => v.height).filter((h) => h > 0))].sort((a, b) => b - a);
    if (!available.length) return text;

    let chosenHeight = available.find((h) => h <= desiredHeight);
    if (!chosenHeight) chosenHeight = available[available.length - 1];

    const keep = new Set(variants.filter((v) => v.height === chosenHeight).map((v) => v.start));
    const output = [];

    for (let i = 0; i < lines.length; i++) {
      const variant = variants.find((v) => v.start === i);
      if (!variant) {
        output.push(lines[i]);
        continue;
      }
      if (keep.has(variant.start)) {
        for (let j = variant.start; j <= variant.end; j++) output.push(lines[j]);
      } else {
        i = variant.end;
      }
    }

    return output.join('\n');
  }

  async function inspectFetchResponse(response, requestUrl) {
    if (!desiredHeight || response.type === 'opaque') return response;
    const url = String(requestUrl || response.url || '');
    if (!/\.m3u8(?:$|[?#])|manifest/i.test(url)) return response;

    try {
      const clone = response.clone();
      const text = await clone.text();
      if (!text.includes('#EXT-X-STREAM-INF:')) return response;
      const rewritten = rewriteMasterPlaylist(text);
      if (rewritten === text) return response;
      return new Response(rewritten, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      console.warn('[Better Crunchyroll] Quality hook could not rewrite HLS manifest', error);
      return response;
    }
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    return inspectFetchResponse(response, requestUrl);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__betterCrunchyrollV237Url = String(url || '');
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this;
    const url = xhr.__betterCrunchyrollV237Url || '';

    if (desiredHeight && /\.m3u8(?:$|[?#])|manifest/i.test(url)) {
      xhr.addEventListener('load', () => {
        try {
          if ((xhr.responseType || '') !== '' && xhr.responseType !== 'text') return;
          const text = xhr.responseText;
          if (!text || !text.includes('#EXT-X-STREAM-INF:')) return;
          const rewritten = rewriteMasterPlaylist(text);
          if (rewritten === text) return;
          Object.defineProperty(xhr, 'responseText', { configurable: true, get: () => rewritten });
          if ((xhr.responseType || '') === '') {
            Object.defineProperty(xhr, 'response', { configurable: true, get: () => rewritten });
          }
        } catch (error) {
          console.warn('[Better Crunchyroll] Quality hook could not rewrite XHR manifest', error);
        }
      }, { once: true });
    }

    return originalSend.apply(this, args);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'better-crunchyroll-v237') return;
    if (event.data.type === 'set-quality') setQuality(event.data.quality);
  });
})();
