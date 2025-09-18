// Simple in-memory cache for resolved asset image URLs by name
const cache = new Map();

const DEFAULT_EXTS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg',
  '.tif', '.tiff', '.bmp', '.dif' // include uncommon just in case
];

function loadOk(url) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const cleanup = () => {
        img.onload = null; img.onerror = null; img.onabort = null;
      };
      img.onload = () => { cleanup(); resolve(true); };
      img.onerror = () => { cleanup(); resolve(false); };
      img.onabort = () => { cleanup(); resolve(false); };
      img.src = url;
    } catch {
      resolve(false);
    }
  });
}

/**
 * Resolve the public URL of an asset image by trying multiple file extensions.
 * Caches results to avoid repeated network calls.
 * @param {string} name Asset name (without extension)
 * @param {object} opts
 * @param {string} [opts.base="/assets"] Base path under public/
 * @param {string[]} [opts.extensions] Extensions to try in order
 * @returns {Promise<string>} resolved URL (may be a best-guess fallback)
 */
export async function resolveAssetImageUrl(name, opts = {}) {
  const base = opts.base || '/assets';
  const exts = opts.extensions || DEFAULT_EXTS;
  const key = `${base}/${name}`;

  if (cache.has(key)) return cache.get(key);

  // Try each extension by actually loading the image to ensure browser can render it
  for (const ext of exts) {
    const lc = `${base}/${name}${ext.toLowerCase()}`;
    if (await loadOk(lc)) {
      cache.set(key, lc);
      return lc;
    }
    const asIs = `${base}/${name}${ext}`;
    if (asIs !== lc && (await loadOk(asIs))) {
      cache.set(key, asIs);
      return asIs;
    }
  }

  // Fallback guess to .jpg to keep UI working
  const fallback = `${base}/${name}.jpg`;
  cache.set(key, fallback);
  return fallback;
}

/** Prime cache for a list of names in background (best-effort). */
export function primeAssetImages(names, opts = {}) {
  names.forEach((n) => {
    const key = `${opts.base || '/assets'}/${n}`;
    if (!cache.has(key)) {
      // fire-and-forget
      resolveAssetImageUrl(n, opts).catch(() => {});
    }
  });
}
