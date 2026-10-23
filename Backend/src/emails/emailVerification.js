// Returns { subject, html, text } for the verification email
const emailVerificationEmail = ({ firstName, verificationUrl }) => ({
  subject: 'Verify your email address – SharedOwnership',
  text: `Hi ${firstName},\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, please ignore this email.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">Verify your email address</h2>
    <p>Hi ${firstName},</p>
    <p>Thanks for registering! Please verify your email address to activate your account.</p>
    <div style="margin:30px 0">
      <a href="${verificationUrl}" style="background:#1a56db;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Verify Email</a>
    </div>
    <p style="color:#666;font-size:14px">Or copy and paste this URL: ${verificationUrl}</p>
    <p style="color:#666;font-size:14px">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
  </div>`,
});

module.exports = { emailVerificationEmail };
