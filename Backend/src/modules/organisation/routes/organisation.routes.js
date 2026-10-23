const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const { singleImage } = require('../../../middleware/upload');
const organisationController = require('../controllers/organisation.controller');
const organisationPropertyController = require('../controllers/organisationProperty.controller');
const organisationDevelopmentController = require('../controllers/organisationDevelopment.controller');
const { createMemberController } = require('../controllers/member.controller');
const { ORG_LOGIN_ROLES } = require('../services/organisation.service');

const router = express.Router();

const organisationOnly = [authenticate, authorize(ROLES.ORGANISATION)];

/** /admins and /users share the same endpoints, each scoped to its own role */
const memberRouter = (role) => {
  const controller = createMemberController(role);
  const members = express.Router();

  members.use(organisationOnly);
  members.post('/', controller.create);
  members.get('/', controller.list);
  members.get('/:memberId', controller.get);
  members.delete('/:memberId', controller.remove);
  if (role === ROLES.ORGANISATION_USER) {
    members.post('/:memberId/approve', controller.approve);
  }
  members.post('/:memberId/impersonate', controller.impersonate);
  members.get('/:memberId/sessions', controller.listSessions);
  members.get('/:memberId/sessions/:sessionId/activities', controller.listSessionActivities);

  return members;
};

// Auth (company email only)
router.post('/register', organisationController.register);
router.post('/login', organisationController.login);
router.post('/refresh-token', organisationController.refreshToken);
router.post(
  '/logout',
  authenticate,
  authorize(ORG_LOGIN_ROLES),
  organisationController.logout
);

// Email verification (public)
router.get('/verify-email/:token', organisationController.verifyEmail);
router.post('/resend-verification', organisationController.resendVerification);

// Forgot / reset password (public)
router.post('/forgot-password', organisationController.forgotPassword);
router.post('/reset-password', organisationController.resetPassword);

// Password change with OTP (authenticated)
router.post('/password/send-otp', organisationOnly, organisationController.sendPasswordChangeOtp);
router.patch('/password', organisationOnly, organisationController.changePasswordWithOtp);

// Profile & dashboard
router.get('/profile', organisationOnly, organisationController.getProfile);
router.patch('/profile', organisationOnly, organisationController.updateProfile);
router.post('/profile/logo', organisationOnly, singleImage('logo'), organisationController.uploadLogo);
router.delete('/profile/logo', organisationOnly, organisationController.removeLogo);
router.get('/dashboard', organisationOnly, organisationController.getDashboard);

// Team
router.use('/admins', memberRouter(ROLES.ORGANISATION_ADMIN));

router.use('/users', memberRouter(ROLES.ORGANISATION_USER));

// Properties (each section is saved separately)
router.post('/properties', organisationOnly, organisationPropertyController.createProperty);
router.get('/properties', organisationOnly, organisationPropertyController.listProperties);
router.get(
  '/properties/:propertyId',
  organisationOnly,
  organisationPropertyController.getProperty
);
router.delete(
  '/properties/:propertyId',
  organisationOnly,
  organisationPropertyController.deleteProperty
);
router.put(
  '/properties/:propertyId/sections/:section',
  organisationOnly,
  organisationPropertyController.saveSection
);

// Developments (each section is saved separately)
router.post('/developments', organisationOnly, organisationDevelopmentController.createDevelopment);
router.get('/developments', organisationOnly, organisationDevelopmentController.listDevelopments);
router.get(
  '/developments/:developmentId',
  organisationOnly,
  organisationDevelopmentController.getDevelopment
);
router.delete(
  '/developments/:developmentId',
  organisationOnly,
  organisationDevelopmentController.deleteDevelopment
);
router.put(
  '/developments/:developmentId/sections/:section',
  organisationOnly,
  organisationDevelopmentController.saveSection
);

module.exports = router;
