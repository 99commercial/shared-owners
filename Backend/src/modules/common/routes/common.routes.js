const express = require('express');
const commonAuthController = require('../controllers/commonAuth.controller');
const commonPublicController = require('../controllers/commonPublic.controller');
const { rateLimit } = require('../../../middleware/rateLimit');

const contactLimit = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many messages sent. Please try again in a few minutes.',
});

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────
// Register: only 'user' and 'organisation' types.
// Org-admins and org-users are created by their organisation.
// Admins are seeded (npm run seed:admin).
router.post('/register', commonAuthController.register);

// Single login endpoint for every role, including admins — auto-detects role from email.
router.post('/login', commonAuthController.login);

// Email verification (link-based, no OTP)
router.get('/verify-email/:token', commonAuthController.verifyEmail);
router.post('/resend-verification', commonAuthController.resendVerification);

// Forgot / reset password (link-based, no OTP)
router.post('/forgot-password', commonAuthController.forgotPassword);
router.post('/reset-password', commonAuthController.resetPassword);

// ─── Public content (no auth required) ───────────────────────────────────

// Properties
router.get('/properties', commonPublicController.listProperties);
router.get('/properties/:propertyId', commonPublicController.getProperty);

// Developments
router.get('/developments', commonPublicController.listDevelopments);
router.get('/developments/:developmentId', commonPublicController.getDevelopment);

// Organisations
router.get('/organisations', commonPublicController.listOrganisations);
router.get('/organisations/:slug', commonPublicController.getOrganisation);

// Blog
router.get('/blogs', commonPublicController.listBlogs);
router.get('/blogs/:slug', commonPublicController.getBlog);

// Contact Us form
router.post('/contact', contactLimit, commonPublicController.submitContactQuery);

module.exports = router;
