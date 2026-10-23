/**
 * Strips '', null and NaN recursively so blank inputs are omitted from the body.
 * The backend resets omitted fields to their defaults, and rejects '' on enum fields.
 * Empty arrays are kept so a list can be cleared.
 */
export const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    });
    return Object.keys(out).length ? out : undefined;
  }
  if (value === '' || value === null || value === undefined || Number.isNaN(value)) return undefined;
  return value;
};

export const toNumber = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));

export const toBool = (v) => (v === 'true' ? true : v === 'false' ? false : undefined);

export const fromBool = (v) => (v === true ? 'true' : v === false ? 'false' : '');

export const str = (v) => (v === undefined || v === null ? '' : String(v));

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const decodeHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/** Plain text (blank-line separated paragraphs) -> <p> HTML, which the backend sanitiser allows */
export const textToHtml = (text) => {
  const paragraphs = (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
};

export const htmlToText = (html) => {
  if (!html) return '';
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h2|h3|h4|blockquote)>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n');
  return decodeHtml(withBreaks).replace(/\n{3,}/g, '\n\n').trim();
};

/** One item per line -> <ul><li> HTML */
export const linesToList = (text) => {
  const items = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '';
};

export const listToLines = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const items = [...doc.querySelectorAll('li')].map((li) => li.textContent.trim());
  return items.length ? items.join('\n') : decodeHtml(html).trim();
};

export const isHttpsUrl = (v) => /^https:\/\/\S+$/i.test(v || '');

export const fileNameFromUrl = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop()) || undefined;
  } catch {
    return undefined;
  }
};

/** Saved image documents -> ImageGalleryEditor rows, in display order */
export const toGalleryRows = (images = []) =>
  [...images]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((img) => ({ url: img.url, caption: img.caption || '', isPrimary: Boolean(img.isPrimary), fileName: img.fileName }));

export const toGalleryBody = (rows) =>
  rows.map((img, i) => ({
    url: img.url,
    caption: img.caption.trim() || undefined,
    fileName: img.fileName || undefined,
    order: i,
    isPrimary: img.isPrimary,
  }));

/** Saved document -> DocumentRow value */
export const toDocRow = (doc) => ({ url: str(doc?.url), fileName: str(doc?.fileName) });

/** DocumentRow value -> request body, or undefined when blank */
export const toDocBody = (doc) => {
  const url = doc.url.trim();
  if (!url) return undefined;
  return { url, fileName: doc.fileName.trim() || fileNameFromUrl(url) };
};
