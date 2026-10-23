const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = config.mail.host
      ? nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.secure,
          auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
};

/** message: { to, subject, text, html } */
const sendMail = async (message) => {
  const info = await getTransporter().sendMail({ from: config.mail.from, ...message });
  if (!config.mail.host) {
    console.log(`[email not sent: SMTP_HOST is not set] to=${message.to} subject="${message.subject}"`);
    if (config.nodeEnv !== 'production' && message.text) console.log(message.text);
  }
  return info;
};

/**
 * Notifications must never undo or fail the action that triggered them,
 * so delivery errors are logged and reported back instead of thrown.
 */
const sendMailSafely = async (message) => {
  try {
    await sendMail(message);
    return { to: message.to, sent: true };
  } catch (err) {
    console.error(`Failed to send email to ${message.to}:`, err.message);
    return { to: message.to, sent: false, error: err.message };
  }
};

/** Logs whether the SMTP server accepts our credentials; used at startup when enabled */
const verifyMailTransport = async () => {
  if (!config.mail.host) return;
  try {
    await getTransporter().verify();
    console.log(`SMTP ready (${config.mail.host}:${config.mail.port} as ${config.mail.user})`);
  } catch (err) {
    console.error(`SMTP verification failed for ${config.mail.host}:`, err.message);
  }
};

module.exports = { sendMail, sendMailSafely, verifyMailTransport };
