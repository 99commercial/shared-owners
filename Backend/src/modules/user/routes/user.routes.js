const express = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const { ROLES } = require('../../../common/roles');
const { singleImage } = require('../../../middleware/upload');
const userController = require('../controllers/user.controller');
const userPropertyController = require('../controllers/userProperty.controller');

const router = express.Router();

const userOnly = [authenticate, authorize(ROLES.USER)];

// Auth
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userOnly, userController.logout);

// Email verification (public)
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);

// Forgot / reset password (public)
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Password change with OTP (authenticated)
router.post('/password/send-otp', userOnly, userController.sendPasswordChangeOtp);
router.patch('/password', userOnly, userController.changePasswordWithOtp);

// Profile & dashboard
router.get('/profile', userOnly, userController.getProfile);
router.patch('/profile', userOnly, userController.updateProfile);
router.post('/profile/avatar', userOnly, singleImage('avatar'), userController.uploadProfilePhoto);
router.delete('/profile/avatar', userOnly, userController.removeProfilePhoto);
router.get('/dashboard', userOnly, userController.getDashboard);

// Properties (each section is saved separately)
router.post('/properties', userOnly, userPropertyController.createProperty);
router.get('/properties', userOnly, userPropertyController.listProperties);
router.get('/properties/:propertyId', userOnly, userPropertyController.getProperty);
router.delete('/properties/:propertyId', userOnly, userPropertyController.deleteProperty);
router.put(
  '/properties/:propertyId/sections/:section',
  userOnly,
  userPropertyController.saveSection
);

module.exports = router;
