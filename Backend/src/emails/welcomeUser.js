const welcomeUserEmail = ({ firstName }) => ({
  subject: 'Welcome to SharedOwnership',
  text: `Hi ${firstName},\n\nWelcome to SharedOwnership! Your account has been created.\n\nPlease check your email for a separate verification email to activate your account.\n\nBest regards,\nThe SharedOwnership Team`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">Welcome to SharedOwnership!</h2>
    <p>Hi ${firstName},</p>
    <p>Your account has been created successfully. Please check your email for a separate verification link to activate your account.</p>
    <p>Once verified, you can log in and start exploring shared ownership properties.</p>
    <p>Best regards,<br>The SharedOwnership Team</p>
  </div>`,
});

module.exports = { welcomeUserEmail };
