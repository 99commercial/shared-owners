// Role → dashboard path mapping used in guards, navbar, and GuestRoute
export const ROLE_REDIRECTS = {
  admin: '/admin',
  organisation: '/org',
  'organisation-admin': '/org-admin',
  'organisation-user': '/org-user',
  user: '/user',
};

// Alias used in components (same values, different name)
export const ROLE_DASHBOARD = ROLE_REDIRECTS;

// organisationProfile.type enum on the backend
export const ORGANISATION_TYPES = [
  { value: 'housing_association', label: 'Housing Association' },
  { value: 'developer', label: 'Developer' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Agent' },
];
