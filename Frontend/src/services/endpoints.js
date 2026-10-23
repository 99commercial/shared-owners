import api from './api';

// ─── Common (public + unified auth) ──────────────────────────────────────

export const commonApi = {
  // Auth
  register: (data) => api.post('/common/register', data),
  login: (data) => api.post('/common/login', data),
  verifyEmail: (token, userId) => api.get(`/common/verify-email/${token}?userId=${userId}`),
  resendVerification: (data) => api.post('/common/resend-verification', data),
  forgotPassword: (data) => api.post('/common/forgot-password', data),
  resetPassword: (data) => api.post('/common/reset-password', data),

  // Public content
  getProperties: (params) => api.get('/common/properties', { params }),
  getProperty: (id) => api.get(`/common/properties/${id}`),
  getDevelopments: (params) => api.get('/common/developments', { params }),
  getDevelopment: (id) => api.get(`/common/developments/${id}`),
  getOrganisations: (params) => api.get('/common/organisations', { params }),
  getOrganisation: (slug) => api.get(`/common/organisations/${slug}`),
  getBlogs: (params) => api.get('/common/blogs', { params }),
  getBlog: (slug) => api.get(`/common/blogs/${slug}`),
  sendContactMessage: (data) => api.post('/common/contact', data),
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  // Users
  registerUser: (data) => api.post('/users/register', data),
  loginUser: (data) => api.post('/users/login', data),
  logoutUser: () => api.post('/users/logout'),
  forgotPasswordUser: (data) => api.post('/users/forgot-password', data),
  resetPasswordUser: (data) => api.post('/users/reset-password', data),
  verifyEmailUser: (token, userId) => api.get(`/users/verify-email/${token}?userId=${userId}`),
  resendVerificationUser: (data) => api.post('/users/resend-verification', data),
  sendPasswordOtpUser: () => api.post('/users/password/send-otp'),
  changePasswordUser: (data) => api.patch('/users/password', data), // OTP-based (new password only)

  // Organisations
  registerOrg: (data) => api.post('/organisations/register', data),
  loginOrg: (data) => api.post('/organisations/login', data),
  logoutOrg: () => api.post('/organisations/logout'),
  forgotPasswordOrg: (data) => api.post('/organisations/forgot-password', data),
  resetPasswordOrg: (data) => api.post('/organisations/reset-password', data),
  verifyEmailOrg: (token, userId) => api.get(`/organisations/verify-email/${token}?userId=${userId}`),

  // Org Admins
  loginOrgAdmin: (data) => api.post('/organisation-admins/login', data),
  logoutOrgAdmin: () => api.post('/organisation-admins/logout'),
  forgotPasswordOrgAdmin: (data) => api.post('/organisation-admins/forgot-password', data),
  resetPasswordOrgAdmin: (data) => api.post('/organisation-admins/reset-password', data),
  sendPasswordOtpOrgAdmin: () => api.post('/organisation-admins/password/send-otp'),
  changePasswordOrgAdmin: (data) => api.patch('/organisation-admins/password', data),

  // Org Users
  registerOrgUser: (data) => api.post('/organisation-users/register', data),
  loginOrgUser: (data) => api.post('/organisation-users/login', data),
  logoutOrgUser: () => api.post('/organisation-users/logout'),
  forgotPasswordOrgUser: (data) => api.post('/organisation-users/forgot-password', data),
  resetPasswordOrgUser: (data) => api.post('/organisation-users/reset-password', data),
  verifyEmailOrgUser: (token, userId) => api.get(`/organisation-users/verify-email/${token}?userId=${userId}`),
  sendPasswordOtpOrgUser: () => api.post('/organisation-users/password/send-otp'),
  changePasswordOrgUser: (data) => api.patch('/organisation-users/password/otp', data), // OTP endpoint differs for org-user

  // Admin
  loginAdmin: (data) => api.post('/admin/login', data),
  logoutAdmin: () => api.post('/admin/logout'),
  changePasswordAdmin: (data) => api.patch('/admin/password', data), // currentPassword + newPassword (no OTP)
};

// ─── User ────────────────────────────────────────────────────────────────────

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  uploadAvatar: (file, onUploadProgress) => {
    const body = new FormData();
    body.append('avatar', file);
    return api.post('/users/profile/avatar', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  removeAvatar: () => api.delete('/users/profile/avatar'),
  getDashboard: () => api.get('/users/dashboard'),
  getProperties: (params) => api.get('/users/properties', { params }),
  getProperty: (id) => api.get(`/users/properties/${id}`),
  createProperty: (data) => api.post('/users/properties', data),
  savePropertySection: (id, section, data) => api.put(`/users/properties/${id}/sections/${section}`, data),
  deleteProperty: (id) => api.delete(`/users/properties/${id}`),
};

// ─── Organisation ─────────────────────────────────────────────────────────────

export const orgApi = {
  getProfile: () => api.get('/organisations/profile'),
  updateProfile: (data) => api.patch('/organisations/profile', data),
  uploadLogo: (file, onUploadProgress) => {
    const body = new FormData();
    body.append('logo', file);
    return api.post('/organisations/profile/logo', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  removeLogo: () => api.delete('/organisations/profile/logo'),
  getDashboard: () => api.get('/organisations/dashboard'),
  sendPasswordOtp: () => api.post('/organisations/password/send-otp'),
  changePassword: (data) => api.patch('/organisations/password', data),
  // Admins
  getAdmins: (params) => api.get('/organisations/admins', { params }),
  getAdmin: (id) => api.get(`/organisations/admins/${id}`),
  createAdmin: (data) => api.post('/organisations/admins', data),
  removeAdmin: (id) => api.delete(`/organisations/admins/${id}`),
  impersonateAdmin: (id) => api.post(`/organisations/admins/${id}/impersonate`),
  // Users
  getUsers: (params) => api.get('/organisations/users', { params }),
  getUser: (id) => api.get(`/organisations/users/${id}`),
  createUser: (data) => api.post('/organisations/users', data),
  removeUser: (id) => api.delete(`/organisations/users/${id}`),
  approveUser: (id) => api.post(`/organisations/users/${id}/approve`),
  impersonateUser: (id) => api.post(`/organisations/users/${id}/impersonate`),
  // Properties
  getProperties: (params) => api.get('/organisations/properties', { params }),
  getProperty: (id) => api.get(`/organisations/properties/${id}`),
  createProperty: (data) => api.post('/organisations/properties', data),
  savePropertySection: (id, section, data) => api.put(`/organisations/properties/${id}/sections/${section}`, data),
  deleteProperty: (id) => api.delete(`/organisations/properties/${id}`),
  // Developments
  getDevelopments: (params) => api.get('/organisations/developments', { params }),
  getDevelopment: (id) => api.get(`/organisations/developments/${id}`),
  createDevelopment: (data) => api.post('/organisations/developments', data),
  saveDevelopmentSection: (id, section, data) => api.put(`/organisations/developments/${id}/sections/${section}`, data),
  deleteDevelopment: (id) => api.delete(`/organisations/developments/${id}`),
};

// ─── Organisation Admin ───────────────────────────────────────────────────────

export const orgAdminApi = {
  getProfile: () => api.get('/organisation-admins/profile'),
  updateProfile: (data) => api.patch('/organisation-admins/profile', data),
  getDashboard: () => api.get('/organisation-admins/dashboard'),
  sendPasswordOtp: () => api.post('/organisation-admins/password/send-otp'),
  changePassword: (data) => api.patch('/organisation-admins/password', data),
  // Users
  getUsers: (params) => api.get('/organisation-admins/users', { params }),
  getUser: (id) => api.get(`/organisation-admins/users/${id}`),
  createUser: (data) => api.post('/organisation-admins/users', data),
  approveUser: (id) => api.post(`/organisation-admins/users/${id}/approve`),
  impersonateUser: (id) => api.post(`/organisation-admins/users/${id}/impersonate`),
  // Properties
  getProperties: (params) => api.get('/organisation-admins/properties', { params }),
  getProperty: (id) => api.get(`/organisation-admins/properties/${id}`),
  createProperty: (data) => api.post('/organisation-admins/properties', data),
  savePropertySection: (id, section, data) => api.put(`/organisation-admins/properties/${id}/sections/${section}`, data),
  deleteProperty: (id) => api.delete(`/organisation-admins/properties/${id}`),
  // Developments
  getDevelopments: (params) => api.get('/organisation-admins/developments', { params }),
  getDevelopment: (id) => api.get(`/organisation-admins/developments/${id}`),
  createDevelopment: (data) => api.post('/organisation-admins/developments', data),
  saveDevelopmentSection: (id, section, data) => api.put(`/organisation-admins/developments/${id}/sections/${section}`, data),
  deleteDevelopment: (id) => api.delete(`/organisation-admins/developments/${id}`),
};

// ─── Organisation User ────────────────────────────────────────────────────────

export const orgUserApi = {
  getProfile: () => api.get('/organisation-users/profile'),
  updateProfile: (data) => api.patch('/organisation-users/profile', data),
  getDashboard: () => api.get('/organisation-users/dashboard'),
  // Properties (no delete for this role)
  getProperties: (params) => api.get('/organisation-users/properties', { params }),
  getProperty: (id) => api.get(`/organisation-users/properties/${id}`),
  createProperty: (data) => api.post('/organisation-users/properties', data),
  savePropertySection: (id, section, data) => api.put(`/organisation-users/properties/${id}/sections/${section}`, data),
  // Developments (no delete for this role)
  getDevelopments: (params) => api.get('/organisation-users/developments', { params }),
  getDevelopment: (id) => api.get(`/organisation-users/developments/${id}`),
  createDevelopment: (data) => api.post('/organisation-users/developments', data),
  saveDevelopmentSection: (id, section, data) => api.put(`/organisation-users/developments/${id}/sections/${section}`, data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.patch('/admin/profile', data),
  uploadAvatar: (file, onProgress) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/admin/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },
  removeAvatar: () => api.delete('/admin/profile/avatar'),
  changePassword: (data) => api.patch('/admin/password', data),
  getDashboard: () => api.get('/admin/dashboard'),
  // Detailed dashboards (params: { days })
  getAccountAnalytics: (params) => api.get('/admin/analytics/accounts', { params }),
  getPropertyAnalytics: (params) => api.get('/admin/analytics/properties', { params }),
  getDevelopmentAnalytics: (params) => api.get('/admin/analytics/developments', { params }),
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
  getUserSessions: (id, params) => api.get(`/admin/users/${id}/sessions`, { params }),
  getUserSessionActivities: (id, sessionId, params) =>
    api.get(`/admin/users/${id}/sessions/${sessionId}/activities`, { params }),
  // Companies
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (id) => api.get(`/admin/companies/${id}`),
  updateCompany: (id, data) => api.patch(`/admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
  impersonateCompany: (id) => api.post(`/admin/companies/${id}/impersonate`),
  getCompanySessions: (id, params) => api.get(`/admin/companies/${id}/sessions`, { params }),
  getCompanySessionActivities: (id, sessionId, params) =>
    api.get(`/admin/companies/${id}/sessions/${sessionId}/activities`, { params }),
  // A company's admins and users: memberType is 'admins' or 'users'
  getCompanyMembers: (companyId, memberType, params) =>
    api.get(`/admin/companies/${companyId}/${memberType}`, { params }),
  getCompanyMember: (companyId, memberType, id) => api.get(`/admin/companies/${companyId}/${memberType}/${id}`),
  updateCompanyMember: (companyId, memberType, id, data) =>
    api.patch(`/admin/companies/${companyId}/${memberType}/${id}`, data),
  deleteCompanyMember: (companyId, memberType, id, data) =>
    api.delete(`/admin/companies/${companyId}/${memberType}/${id}`, { data }),
  impersonateCompanyMember: (companyId, memberType, id) =>
    api.post(`/admin/companies/${companyId}/${memberType}/${id}/impersonate`),
  getCompanyMemberSessions: (companyId, memberType, id, params) =>
    api.get(`/admin/companies/${companyId}/${memberType}/${id}/sessions`, { params }),
  getCompanyMemberSessionActivities: (companyId, memberType, id, sessionId, params) =>
    api.get(`/admin/companies/${companyId}/${memberType}/${id}/sessions/${sessionId}/activities`, { params }),
  // Blog posts
  getBlogs: (params) => api.get('/admin/blogs', { params }),
  getBlog: (id) => api.get(`/admin/blogs/${id}`),
  createBlog: (data) => api.post('/admin/blogs', data),
  updateBlog: (id, data) => api.patch(`/admin/blogs/${id}`, data),
  deleteBlog: (id) => api.delete(`/admin/blogs/${id}`),
  uploadBlogImage: (file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/admin/blogs/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },
  // Contact Us messages
  getContactQueries: (params) => api.get('/admin/contact-queries', { params }),
  getContactQuery: (id) => api.get(`/admin/contact-queries/${id}`),
  updateContactQuery: (id, data) => api.patch(`/admin/contact-queries/${id}`, data),
  deleteContactQuery: (id) => api.delete(`/admin/contact-queries/${id}`),
  // Properties
  getProperties: (params) => api.get('/admin/properties', { params }),
  getProperty: (id) => api.get(`/admin/properties/${id}`),
  deleteProperty: (id) => api.delete(`/admin/properties/${id}`),
  // Property approvals
  getApprovals: (params) => api.get('/admin/property-approvals', { params }),
  getApproval: (id) => api.get(`/admin/property-approvals/${id}`),
  approveProperty: (id, data) => api.post(`/admin/property-approvals/${id}/approve`, data),
  rejectProperty: (id, data) => api.post(`/admin/property-approvals/${id}/reject`, data),
  // Developments
  getDevelopments: (params) => api.get('/admin/developments', { params }),
  getDevelopment: (id) => api.get(`/admin/developments/${id}`),
  deleteDevelopment: (id) => api.delete(`/admin/developments/${id}`),
};

// ─── Chat (buyers, companies, and company staff) ─────────────────────────────

export const chatApi = {
  list: (params) => api.get('/chat', { params }),
  unreadCount: () => api.get('/chat/unread-count'),
  start: (propertyId, text) => api.post(`/chat/properties/${propertyId}`, text ? { text } : {}),
  get: (id) => api.get(`/chat/${id}`),
  messages: (id, params) => api.get(`/chat/${id}/messages`, { params }),
  send: (id, text) => api.post(`/chat/${id}/messages`, { text }),
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const publicApi = {
  getProperties: (params) => api.get('/admin/properties', { params }),
  getDevelopments: (params) => api.get('/admin/developments', { params }),
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (slug) => api.get(`/admin/companies/${slug}`),
};
