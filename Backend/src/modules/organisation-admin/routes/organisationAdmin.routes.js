const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const organisationAdminController = require('../controllers/organisationAdmin.controller');
const organisationAdminUserController = require('../controllers/organisationAdminUser.controller');
const organisationAdminPropertyController = require('../controllers/organisationAdminProperty.controller');
const organisationAdminDevelopmentController = require('../controllers/organisationAdminDevelopment.controller');

const router = express.Router();

const adminOnly = [authenticate, authorize(ROLES.ORGANISATION_ADMIN)];

// Auth (company email only; admins are created by their organisation)
router.post('/login', organisationAdminController.login);
router.post('/refresh-token', organisationAdminController.refreshToken);
router.post('/logout', adminOnly, organisationAdminController.logout);

// Forgot / reset password (public; no email verification — admins are created by org)
router.post('/forgot-password', organisationAdminController.forgotPassword);
router.post('/reset-password', organisationAdminController.resetPassword);

// Password change with OTP (authenticated)
router.post('/password/send-otp', adminOnly, organisationAdminController.sendPasswordChangeOtp);
router.patch('/password', adminOnly, organisationAdminController.changePasswordWithOtp);

// Own admin profile & organisation dashboard
router.get('/profile', adminOnly, organisationAdminController.getProfile);
router.patch('/profile', adminOnly, organisationAdminController.updateProfile);
router.get('/dashboard', adminOnly, organisationAdminController.getDashboard);

// Organisation users: create, approve + impersonate, with read-only views to find them
router.post('/users', adminOnly, organisationAdminUserController.createUser);
router.get('/users', adminOnly, organisationAdminUserController.listUsers);
router.get('/users/:memberId', adminOnly, organisationAdminUserController.getUser);
router.post('/users/:memberId/approve', adminOnly, organisationAdminUserController.approveUser);
router.post(
  '/users/:memberId/impersonate',
  adminOnly,
  organisationAdminUserController.impersonateUser
);
router.get('/users/:memberId/sessions', adminOnly, organisationAdminUserController.listSessions);
router.get(
  '/users/:memberId/sessions/:sessionId/activities',
  adminOnly,
  organisationAdminUserController.listSessionActivities
);

// Organisation properties (each section is saved separately)
router.post('/properties', adminOnly, organisationAdminPropertyController.createProperty);
router.get('/properties', adminOnly, organisationAdminPropertyController.listProperties);
router.get('/properties/:propertyId', adminOnly, organisationAdminPropertyController.getProperty);
router.delete('/properties/:propertyId', adminOnly, organisationAdminPropertyController.deleteProperty);
router.put(
  '/properties/:propertyId/sections/:section',
  adminOnly,
  organisationAdminPropertyController.saveSection
);

// Organisation developments (each section is saved separately)
router.post('/developments', adminOnly, organisationAdminDevelopmentController.createDevelopment);
router.get('/developments', adminOnly, organisationAdminDevelopmentController.listDevelopments);
router.get(
  '/developments/:developmentId',
  adminOnly,
  organisationAdminDevelopmentController.getDevelopment
);
router.delete(
  '/developments/:developmentId',
  adminOnly,
  organisationAdminDevelopmentController.deleteDevelopment
);
router.put(
  '/developments/:developmentId/sections/:section',
  adminOnly,
  organisationAdminDevelopmentController.saveSection
);

module.exports = router;
