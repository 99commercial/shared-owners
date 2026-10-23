const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const organisationUserController = require('../controllers/organisationUser.controller');
const organisationUserPropertyController = require('../controllers/organisationUserProperty.controller');
const organisationUserDevelopmentController = require('../controllers/organisationUserDevelopment.controller');

const router = express.Router();

const orgUserOnly = [authenticate, authorize(ROLES.ORGANISATION_USER)];

// Auth (company email only; self-registered accounts wait for organisation approval)
router.post('/register', organisationUserController.register);
router.post('/login', organisationUserController.login);
router.post('/refresh-token', organisationUserController.refreshToken);
router.post('/logout', orgUserOnly, organisationUserController.logout);

// Email verification (public; for self-registered org-users)
router.get('/verify-email/:token', organisationUserController.verifyEmail);
router.post('/resend-verification', organisationUserController.resendVerification);

// Forgot / reset password (public)
router.post('/forgot-password', organisationUserController.forgotPassword);
router.post('/reset-password', organisationUserController.resetPassword);

// Password change with OTP (authenticated)
router.post('/password/send-otp', orgUserOnly, organisationUserController.sendPasswordChangeOtp);
router.patch('/password/otp', orgUserOnly, organisationUserController.changePasswordWithOtp);

// Own profile & dashboard
router.get('/profile', orgUserOnly, organisationUserController.getProfile);
router.patch('/profile', orgUserOnly, organisationUserController.updateProfile);
router.patch('/password', orgUserOnly, organisationUserController.changePassword);
router.get('/dashboard', orgUserOnly, organisationUserController.getDashboard);

// Properties they created or are assigned to (each section is saved separately, no delete)
router.post('/properties', orgUserOnly, organisationUserPropertyController.createProperty);
router.get('/properties', orgUserOnly, organisationUserPropertyController.listProperties);
router.get('/properties/:propertyId', orgUserOnly, organisationUserPropertyController.getProperty);
router.put(
  '/properties/:propertyId/sections/:section',
  orgUserOnly,
  organisationUserPropertyController.saveSection
);

// Developments they created or are assigned to (each section is saved separately, no delete)
router.post('/developments', orgUserOnly, organisationUserDevelopmentController.createDevelopment);
router.get('/developments', orgUserOnly, organisationUserDevelopmentController.listDevelopments);
router.get(
  '/developments/:developmentId',
  orgUserOnly,
  organisationUserDevelopmentController.getDevelopment
);
router.put(
  '/developments/:developmentId/sections/:section',
  orgUserOnly,
  organisationUserDevelopmentController.saveSection
);

module.exports = router;
