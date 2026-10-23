export const CHAT_HOME = {
  user: '/user/messages',
  organisation: '/org/messages',
  'organisation-admin': '/org-admin/messages',
  'organisation-user': '/org-user/messages',
};

export const chatHomeFor = (role) => CHAT_HOME[role] || null;

/** Short label for a message timestamp */
export const chatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};
