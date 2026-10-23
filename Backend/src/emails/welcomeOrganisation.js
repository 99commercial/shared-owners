const welcomeOrganisationEmail = ({ orgName }) => ({
  subject: 'Welcome to SharedOwnership – Organisation Account Created',
  text: `Dear ${orgName} team,\n\nYour organisation account on SharedOwnership has been created successfully.\n\nPlease check your email for a separate verification link to activate your account.\n\nOnce verified, you can log in to manage your properties and team members.\n\nBest regards,\nThe SharedOwnership Team`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">Welcome to SharedOwnership</h2>
    <p>Dear ${orgName} team,</p>
    <p>Your organisation account has been created successfully. Please check your email for a separate verification link to activate your account.</p>
    <p>Once verified, you can log in to manage your properties, team members, and developments.</p>
    <p>Best regards,<br>The SharedOwnership Team</p>
  </div>`,
});

module.exports = { welcomeOrganisationEmail };
