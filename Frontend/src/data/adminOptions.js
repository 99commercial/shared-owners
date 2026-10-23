import { labelize } from './propertyOptions';

// Mirrors Backend/src/common/contentOptions.js and the admin analytics ranges.

export const ROLE_LABELS = {
  admin: 'Platform admin',
  user: 'Individual user',
  organisation: 'Organisation',
  'organisation-admin': 'Organisation admin',
  'organisation-user': 'Organisation user',
};

export const ROLE_SHORT_LABELS = {
  user: 'Users',
  organisation: 'Organisations',
  'organisation-admin': 'Org admins',
  'organisation-user': 'Org users',
};

/** Account roles shown on the dashboards, with their chart colours */
export const ACCOUNT_ROLES = ['user', 'organisation', 'organisation-admin', 'organisation-user'];
export const ROLE_COLORS = {
  user: '#2563eb',
  organisation: '#7c3aed',
  'organisation-admin': '#0891b2',
  'organisation-user': '#f59e0b',
};

export const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '12 months' },
];

export const ACCOUNT_STATUS_FILTERS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Deactivated' },
];

export const MEMBER_TYPES = {
  admins: { singular: 'Admin', plural: 'Admins', role: 'organisation-admin', profileKey: 'organisationAdminProfile' },
  users: { singular: 'User', plural: 'Users', role: 'organisation-user', profileKey: 'organisationUserProfile' },
};

export const OWNER_TYPE_OPTIONS = [
  { value: 'user', label: 'Individual users' },
  { value: 'organisation', label: 'Organisations' },
];

export const BLOG_CATEGORIES = ['guides', 'news', 'market_insights', 'finance', 'case_studies', 'developments'];
export const BLOG_CATEGORY_OPTIONS = BLOG_CATEGORIES.map((c) => ({ value: c, label: labelize(c) }));
export const BLOG_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];
export const BLOG_STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
};
export const MAX_BLOG_TAGS = 10;
export const MAX_BLOG_EXCERPT = 300;

export const CONTACT_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];
export const CONTACT_STATUS_STYLES = {
  new: 'bg-brand-100 text-brand-700',
  read: 'bg-gray-100 text-gray-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-slate-200 text-slate-600',
};

/** Palette for categorical charts (donuts, bar lists) */
export const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#f59e0b', '#16a34a', '#e11d48', '#64748b', '#ea580c'];

export const STATUS_COLORS = {
  draft: '#94a3b8',
  pending_approval: '#f59e0b',
  live: '#16a34a',
  archived: '#64748b',
  suspended: '#e11d48',
};
