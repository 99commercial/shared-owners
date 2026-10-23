const passwordChangeOtpEmail = ({ firstName, otp }) => ({
  subject: 'Your password change verification code – SharedOwnership',
  text: `Hi ${firstName},\n\nYour verification code to change your password is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">Password change verification code</h2>
    <p>Hi ${firstName},</p>
    <p>Your verification code to change your password is:</p>
    <div style="margin:20px 0;padding:20px;background:#f3f4f6;border-radius:8px;text-align:center">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a56db">${otp}</span>
    </div>
    <p style="color:#666;font-size:14px">This code expires in 10 minutes.</p>
    <p style="color:#666;font-size:14px">If you did not request a password change, please secure your account immediately.</p>
  </div>`,
});

module.exports = { passwordChangeOtpEmail };
