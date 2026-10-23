const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** { subject, html, text } when a chat message is still unread */
const chatMessageEmail = ({ recipientName, senderLabel, propertyName, snippet, chatUrl }) => ({
  subject: `New message about ${propertyName}`,
  text: `Hi ${recipientName},\n\n${senderLabel} sent you a message about ${propertyName}, and it hasn't been read yet.\n\n"${snippet}"\n\nOpen the conversation: ${chatUrl}\n`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h2 style="color:#1a56db">New message</h2>
    <p>Hi ${escapeHtml(recipientName)},</p>
    <p><b>${escapeHtml(senderLabel)}</b> sent you a message about <b>${escapeHtml(propertyName)}</b>, and it hasn't been read yet.</p>
    <blockquote style="margin:20px 0;padding:12px 16px;border-left:4px solid #1a56db;background:#f3f4f6;color:#111827">${escapeHtml(snippet)}</blockquote>
    <div style="margin:30px 0">
      <a href="${chatUrl}" style="background:#1a56db;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Open conversation</a>
    </div>
    <p style="color:#666;font-size:14px">Or copy and paste this URL: ${escapeHtml(chatUrl)}</p>
  </div>`,
});

module.exports = { chatMessageEmail };
