const sanitizeHtml = require('sanitize-html');

/** Tags the rich-text editor can produce. Scripts, styles, iframes and event handlers are stripped. */
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a',
  ],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
  },
};

const sanitizeRichText = (value) =>
  typeof value === 'string' ? sanitizeHtml(value, OPTIONS).trim() : value;

/** Blog articles also allow https images and horizontal rules */
const ARTICLE_OPTIONS = {
  ...OPTIONS,
  allowedTags: [...OPTIONS.allowedTags, 'img', 'hr'],
  allowedAttributes: { ...OPTIONS.allowedAttributes, img: ['src', 'alt'] },
  allowedSchemesByTag: { img: ['https'] },
};

const sanitizeArticleHtml = (value) =>
  typeof value === 'string' ? sanitizeHtml(value, ARTICLE_OPTIONS).trim() : value;

/** Plain text of sanitised HTML, e.g. for word counts */
const htmlToPlainText = (html = '') =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();

module.exports = { sanitizeRichText, sanitizeArticleHtml, htmlToPlainText };
