const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const adminController = require('../controllers/admin.controller');
const adminUserController = require('../controllers/adminUser.controller');
const adminCompanyController = require('../controllers/adminCompany.controller');
const { createCompanyMemberController } = require('../controllers/adminCompanyMember.controller');
const adminPropertyController = require('../controllers/adminProperty.controller');
const adminDevelopmentController = require('../controllers/adminDevelopment.controller');
const adminAnalyticsController = require('../controllers/adminAnalytics.controller');
const adminContentController = require('../controllers/adminContent.controller');
const { singleImage } = require('../../../middleware/upload');

const router = express.Router();

const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

/** A company's /admins and /users share the same endpoints, each scoped to its own role */
const companyMemberRouter = (role) => {
  const controller = createCompanyMemberController(role);
  const members = express.Router({ mergeParams: true });

  members.use(adminOnly);
  members.get('/', controller.list);
  members.get('/:memberId', controller.get);
  members.patch('/:memberId', controller.update);
  members.delete('/:memberId', controller.remove);
  members.post('/:memberId/impersonate', controller.impersonate);
  members.get('/:memberId/sessions', controller.listSessions);
  members.get('/:memberId/sessions/:sessionId/activities', controller.listSessionActivities);

  return members;
};

// Auth (admins are seeded with `npm run seed:admin`; there is no register)
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshToken);
router.post('/logout', adminOnly, adminController.logout);

// Own profile & platform dashboard
router.get('/profile', adminOnly, adminController.getProfile);
router.patch('/profile', adminOnly, adminController.updateProfile);
router.post('/profile/avatar', adminOnly, singleImage('avatar'), adminController.uploadProfilePhoto);
router.delete('/profile/avatar', adminOnly, adminController.removeProfilePhoto);
router.patch('/password', adminOnly, adminController.changePassword);
router.get('/dashboard', adminOnly, adminController.getDashboard);

// Detailed dashboards (?days=7|30|90|365)
router.get('/analytics/accounts', adminOnly, adminAnalyticsController.getAccountAnalytics);
router.get('/analytics/properties', adminOnly, adminAnalyticsController.getPropertyAnalytics);
router.get('/analytics/developments', adminOnly, adminAnalyticsController.getDevelopmentAnalytics);

// Individual users
router.get('/users', adminOnly, adminUserController.listUsers);
router.get('/users/:userId', adminOnly, adminUserController.getUser);
router.patch('/users/:userId', adminOnly, adminUserController.updateUser);
router.delete('/users/:userId', adminOnly, adminUserController.deleteUser);
router.post('/users/:userId/impersonate', adminOnly, adminUserController.impersonateUser);
router.get('/users/:userId/sessions', adminOnly, adminUserController.listSessions);
router.get(
  '/users/:userId/sessions/:sessionId/activities',
  adminOnly,
  adminUserController.listSessionActivities
);

// Companies (organisation accounts)
router.get('/companies', adminOnly, adminCompanyController.listCompanies);
router.get('/companies/:companyId', adminOnly, adminCompanyController.getCompany);
router.patch('/companies/:companyId', adminOnly, adminCompanyController.updateCompany);
router.delete('/companies/:companyId', adminOnly, adminCompanyController.deleteCompany);
router.post('/companies/:companyId/impersonate', adminOnly, adminCompanyController.impersonateCompany);
router.get('/companies/:companyId/sessions', adminOnly, adminCompanyController.listSessions);
router.get(
  '/companies/:companyId/sessions/:sessionId/activities',
  adminOnly,
  adminCompanyController.listSessionActivities
);

// Company panel: its admins and users
router.use('/companies/:companyId/admins', companyMemberRouter(ROLES.ORGANISATION_ADMIN));
router.use('/companies/:companyId/users', companyMemberRouter(ROLES.ORGANISATION_USER));

// Individual users' complete listings waiting for admin approval
router.get('/property-approvals', adminOnly, adminPropertyController.listApprovals);
router.get('/property-approvals/:propertyId', adminOnly, adminPropertyController.getApproval);
router.post(
  '/property-approvals/:propertyId/approve',
  adminOnly,
  adminPropertyController.approveProperty
);
router.post(
  '/property-approvals/:propertyId/reject',
  adminOnly,
  adminPropertyController.rejectProperty
);

// All properties
router.get('/properties', adminOnly, adminPropertyController.listProperties);
router.get('/properties/:propertyId', adminOnly, adminPropertyController.getProperty);
router.delete('/properties/:propertyId', adminOnly, adminPropertyController.deleteProperty);

// All developments
router.get('/developments', adminOnly, adminDevelopmentController.listDevelopments);
router.get('/developments/:developmentId', adminOnly, adminDevelopmentController.getDevelopment);
router.delete('/developments/:developmentId', adminOnly, adminDevelopmentController.deleteDevelopment);

// Blog posts
router.get('/blogs', adminOnly, adminContentController.listBlogs);
router.post('/blogs', adminOnly, adminContentController.createBlog);
router.post('/blogs/images', adminOnly, singleImage('image'), adminContentController.uploadBlogImage);
router.get('/blogs/:blogId', adminOnly, adminContentController.getBlog);
router.patch('/blogs/:blogId', adminOnly, adminContentController.updateBlog);
router.delete('/blogs/:blogId', adminOnly, adminContentController.deleteBlog);

// Messages from the public Contact Us form
router.get('/contact-queries', adminOnly, adminContentController.listContactQueries);
router.get('/contact-queries/:queryId', adminOnly, adminContentController.getContactQuery);
router.patch('/contact-queries/:queryId', adminOnly, adminContentController.updateContactQuery);
router.delete('/contact-queries/:queryId', adminOnly, adminContentController.deleteContactQuery);

module.exports = router;
