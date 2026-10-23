const BLOG_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

const BLOG_CATEGORIES = Object.freeze([
  'guides',
  'news',
  'market_insights',
  'finance',
  'case_studies',
  'developments',
]);

const MAX_BLOG_TAGS = 10;
const MAX_BLOG_EXCERPT = 300;

const CONTACT_QUERY_STATUS = Object.freeze({
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  ARCHIVED: 'archived',
});

module.exports = {
  BLOG_STATUS,
  BLOG_STATUS_VALUES: Object.freeze(Object.values(BLOG_STATUS)),
  BLOG_CATEGORIES,
  MAX_BLOG_TAGS,
  MAX_BLOG_EXCERPT,
  CONTACT_QUERY_STATUS,
  CONTACT_QUERY_STATUS_VALUES: Object.freeze(Object.values(CONTACT_QUERY_STATUS)),
};
