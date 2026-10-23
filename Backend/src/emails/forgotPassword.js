const forgotPasswordEmail = ({ firstName, resetUrl }) => ({
  subject: 'Reset your password – SharedOwnership',
  text: `Hi ${firstName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">Reset your password</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <div style="margin:30px 0">
      <a href="${resetUrl}" style="background:#1a56db;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Reset Password</a>
    </div>
    <p style="color:#666;font-size:14px">Or copy and paste this URL: ${resetUrl}</p>
    <p style="color:#666;font-size:14px">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
  </div>`,
});

module.exports = { forgotPasswordEmail };
