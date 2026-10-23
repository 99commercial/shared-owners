const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);

const reasonLines = (reason) =>
  reason ? { text: `\nReason: ${reason}\n`, html: `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` } : { text: '', html: '' };

/** To the removed organisation admin / user */
const toMember = ({ memberName, roleLabel, organisationName, reason }) => {
  const extra = reasonLines(reason);
  return {
    subject: `Your ${organisationName} account has been removed`,
    text:
      `Hello ${memberName},\n\n` +
      `Your organisation ${roleLabel.toLowerCase()} account for ${organisationName} has been removed by the platform administrator. ` +
      `You can no longer sign in with it.\n${extra.text}\n` +
      'If you think this is a mistake, please contact your organisation.\n',
    html:
      `<p>Hello ${escapeHtml(memberName)},</p>` +
      `<p>Your organisation ${escapeHtml(roleLabel.toLowerCase())} account for <strong>${escapeHtml(organisationName)}</strong> ` +
      'has been removed by the platform administrator. You can no longer sign in with it.</p>' +
      `${extra.html}<p>If you think this is a mistake, please contact your organisation.</p>`,
  };
};

/** To the organisation the member belonged to */
const toOrganisation = ({ memberName, memberEmail, roleLabel, organisationName, reason }) => {
  const extra = reasonLines(reason);
  return {
    subject: `An organisation ${roleLabel.toLowerCase()} was removed from ${organisationName}`,
    text:
      `Hello ${organisationName},\n\n` +
      `The platform administrator has removed ${memberName} (${memberEmail}), an organisation ${roleLabel.toLowerCase()}, from your organisation. ` +
      `Their sessions have been ended. Listings they created stay with your organisation.\n${extra.text}`,
    html:
      `<p>Hello ${escapeHtml(organisationName)},</p>` +
      `<p>The platform administrator has removed <strong>${escapeHtml(memberName)}</strong> (${escapeHtml(memberEmail)}), ` +
      `an organisation ${escapeHtml(roleLabel.toLowerCase())}, from your organisation. ` +
      'Their sessions have been ended. Listings they created stay with your organisation.</p>' +
      extra.html,
  };
};

module.exports = { toMember, toOrganisation };
