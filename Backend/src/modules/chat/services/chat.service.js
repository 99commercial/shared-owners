const mongoose = require('mongoose');
const Conversation = require('../../../models/Conversation');
const Message = require('../../../models/Message');
const User = require('../../../models/User');
const { Property } = require('../../../models/property');
const ApiError = require('../../../utils/ApiError');
const config = require('../../../config');
const { sendMailSafely } = require('../../../utils/email.service');
const { parsePagination, buildPage } = require('../../../utils/pagination');
const { chatMessageEmail } = require('../../../emails/chatMessage');
const { ROLES, ORG_MEMBER_ROLES } = require('../../../common/roles');
const { PROPERTY_STATUS } = require('../../../common/propertyOptions');

const MESSAGE_PAGE = 10;
const MAX_MESSAGE_LENGTH = 2000;
const SWEEP_EVERY_MS = 60 * 1000;

const CHAT_PATH_BY_ROLE = Object.freeze({
  [ROLES.USER]: '/user/messages',
  [ROLES.ORGANISATION]: '/org/messages',
  [ROLES.ORGANISATION_ADMIN]: '/org-admin/messages',
  [ROLES.ORGANISATION_USER]: '/org-user/messages',
});

const IDENTITY_FIELDS = [
  'role',
  'email',
  'organisationId',
  'userProfile.firstName',
  'userProfile.lastName',
  'userProfile.avatarUrl',
  'organisationProfile.name',
  'organisationProfile.logoUrl',
  'organisationProfile.contactEmail',
  'organisationAdminProfile.firstName',
  'organisationAdminProfile.lastName',
  'organisationAdminProfile.avatarUrl',
  'organisationUserProfile.firstName',
  'organisationUserProfile.lastName',
  'organisationUserProfile.avatarUrl',
].join(' ');

const personName = (profile) => [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();

/**
 * Public label for a chat participant. Company staff show their own name and
 * the company they belong to — never whether they are an admin or a user.
 */
const identityOf = (user, companies) => {
  if (!user) return { _id: null, name: 'Unknown', companyName: null, avatarUrl: null };
  if (user.role === ROLES.ORGANISATION) {
    return {
      _id: String(user._id),
      name: user.organisationProfile?.name || 'Company',
      companyName: null,
      avatarUrl: user.organisationProfile?.logoUrl || null,
    };
  }
  if (user.role === ROLES.USER) {
    return {
      _id: String(user._id),
      name: personName(user.userProfile) || 'User',
      companyName: null,
      avatarUrl: user.userProfile?.avatarUrl || null,
    };
  }
  const profile = user.role === ROLES.ORGANISATION_ADMIN
    ? user.organisationAdminProfile
    : user.organisationUserProfile;
  const company = companies.get(String(user.organisationId));
  return {
    _id: String(user._id),
    name: personName(profile) || 'Team member',
    companyName: company?.organisationProfile?.name || null,
    avatarUrl: profile?.avatarUrl || company?.organisationProfile?.logoUrl || null,
  };
};

const displayLabel = (identity) => (
  identity.companyName ? `${identity.name} (${identity.companyName})` : identity.name
);

const ownsListing = (actor, property) => {
  const ownerId = String(property.owner);
  return actor.id === ownerId || (actor.organisationId && actor.organisationId === ownerId);
};

const isEnquirer = (actor, conversation) => String(conversation.enquirer) === String(actor.id);

/** Conversations this account can open */
const accessFilter = (actor) => {
  const clauses = [{ enquirer: actor.id }, { owner: actor.id }];
  if (actor.organisationId) clauses.push({ owner: actor.organisationId });
  return { $or: clauses };
};

const canAccess = (actor, conversation) => {
  if (!conversation) return false;
  if (isEnquirer(actor, conversation)) return true;
  const ownerId = String(conversation.owner);
  return actor.id === ownerId || actor.organisationId === ownerId;
};

const cleanText = (value) => {
  if (typeof value !== 'string') throw new ApiError(400, 'Message is required');
  const text = value.trim();
  if (!text) throw new ApiError(400, 'Message is required');
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }
  return text;
};

const loadUsers = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select(IDENTITY_FIELDS).lean();
  return new Map(users.map((user) => [String(user._id), user]));
};

const loadCompanies = async (users) => {
  const orgIds = [...users.values()]
    .filter((user) => ORG_MEMBER_ROLES.includes(user.role) && user.organisationId)
    .map((user) => user.organisationId);
  if (!orgIds.length) return new Map();
  const companies = await User.find({ _id: { $in: orgIds }, role: ROLES.ORGANISATION })
    .select('organisationProfile.name organisationProfile.logoUrl')
    .lean();
  return new Map(companies.map((company) => [String(company._id), company]));
};

const propertyCard = (conversation) => ({
  _id: conversation.property,
  name: conversation.propertyName,
  reference: conversation.propertyReference || null,
  imageUrl: conversation.propertyImageUrl || null,
});

const presentConversation = (actor, conversation, users, companies) => {
  const lastSenderId = conversation.lastMessageBy ? String(conversation.lastMessageBy) : null;
  const otherId = isEnquirer(actor, conversation)
    ? (lastSenderId && lastSenderId !== String(actor.id) ? lastSenderId : String(conversation.owner))
    : String(conversation.enquirer);
  return {
    _id: conversation._id,
    property: propertyCard(conversation),
    otherParty: identityOf(users.get(otherId), companies),
    lastMessage: conversation.lastMessageText
      ? {
          text: conversation.lastMessageText,
          sentAt: conversation.lastMessageAt,
          mine: lastSenderId === String(actor.id),
        }
      : null,
    unreadCount: isEnquirer(actor, conversation) ? conversation.enquirerUnread : conversation.ownerUnread,
    updatedAt: conversation.updatedAt,
  };
};

const presentMessage = (actor, message, users, companies) => ({
  _id: message._id,
  text: message.body,
  sentAt: message.createdAt,
  mine: String(message.sender) === String(actor.id),
  sender: identityOf(users.get(String(message.sender)), companies),
});

const loadConversation = async (actor, conversationId) => {
  if (!mongoose.isValidObjectId(conversationId)) throw new ApiError(400, 'Invalid conversation');
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !canAccess(actor, conversation)) throw new ApiError(404, 'Conversation not found');
  return conversation;
};

/** Opening or replying counts as having read everything the other side sent */
const markSideRead = async (actor, conversation) => {
  const mine = isEnquirer(actor, conversation);
  await Message.updateMany(
    mine
      ? { conversation: conversation._id, sender: { $ne: conversation.enquirer }, readAt: null }
      : { conversation: conversation._id, sender: conversation.enquirer, readAt: null },
    { $set: { readAt: new Date() } }
  );
  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: mine ? { enquirerUnread: 0 } : { ownerUnread: 0 } }
  );
  if (mine) conversation.enquirerUnread = 0;
  else conversation.ownerUnread = 0;
};

const addMessage = async (actor, conversation, text) => {
  const message = await Message.create({
    conversation: conversation._id,
    sender: actor.id,
    body: text,
  });
  const fromEnquirer = isEnquirer(actor, conversation);
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessageText: text,
        lastMessageAt: message.createdAt,
        lastMessageBy: actor.id,
      },
      $inc: fromEnquirer ? { ownerUnread: 1 } : { enquirerUnread: 1 },
    }
  );
  await markSideRead(actor, conversation);
  const users = await loadUsers([actor.id]);
  const companies = await loadCompanies(users);
  return presentMessage(actor, message, users, companies);
};

const listConversations = async (actor, query) => {
  const paging = parsePagination(query);
  const filter = accessFilter(actor);
  const [rows, total] = await Promise.all([
    Conversation.find(filter).sort({ lastMessageAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    Conversation.countDocuments(filter),
  ]);
  const users = await loadUsers(rows.flatMap((row) => [row.enquirer, row.owner, row.lastMessageBy]));
  const companies = await loadCompanies(users);
  return buildPage(rows.map((row) => presentConversation(actor, row, users, companies)), total, paging);
};

const unreadCount = async (actor) => {
  const rows = await Conversation.find(accessFilter(actor)).select('enquirer enquirerUnread ownerUnread').lean();
  const count = rows.reduce(
    (sum, row) => sum + (String(row.enquirer) === String(actor.id) ? row.enquirerUnread : row.ownerUnread),
    0
  );
  return { count };
};

const getConversation = async (actor, conversationId) => {
  const conversation = await loadConversation(actor, conversationId);
  const users = await loadUsers([conversation.enquirer, conversation.owner, conversation.lastMessageBy]);
  const companies = await loadCompanies(users);
  return { conversation: presentConversation(actor, conversation.toObject(), users, companies) };
};

const listMessages = async (actor, conversationId, query) => {
  const conversation = await loadConversation(actor, conversationId);
  const filter = { conversation: conversation._id };
  if (query.before) {
    if (!mongoose.isValidObjectId(query.before)) throw new ApiError(400, 'Invalid cursor');
    const cursor = await Message.findOne({ _id: query.before, conversation: conversation._id }).select('createdAt').lean();
    if (!cursor) throw new ApiError(400, 'Invalid cursor');
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ];
  }
  const rows = await Message.find(filter).sort({ createdAt: -1, _id: -1 }).limit(MESSAGE_PAGE).lean();
  await markSideRead(actor, conversation);
  const users = await loadUsers(rows.map((row) => row.sender));
  const companies = await loadCompanies(users);
  return {
    messages: rows.map((row) => presentMessage(actor, row, users, companies)),
    hasMore: rows.length === MESSAGE_PAGE,
  };
};

const sendMessage = async (actor, conversationId, body) => {
  const conversation = await loadConversation(actor, conversationId);
  const message = await addMessage(actor, conversation, cleanText(body?.text ?? body?.message));
  return { message };
};

const startConversation = async (actor, propertyId, body) => {
  if (!mongoose.isValidObjectId(propertyId)) throw new ApiError(400, 'Invalid property');
  const property = await Property.findOne({
    _id: propertyId,
    status: PROPERTY_STATUS.LIVE,
    isDeleted: false,
  }).select('name reference owner searchSnapshot.primaryImageUrl').lean();
  if (!property) throw new ApiError(404, 'This property is not available');
  if (ownsListing(actor, property)) throw new ApiError(400, 'You cannot message your own listing');

  let conversation = await Conversation.findOne({ property: property._id, enquirer: actor.id });
  let created = false;
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        property: property._id,
        propertyName: property.name,
        propertyReference: property.reference,
        propertyImageUrl: property.searchSnapshot?.primaryImageUrl,
        enquirer: actor.id,
        owner: property.owner,
        lastMessageAt: new Date(),
      });
      created = true;
    } catch (err) {
      if (err.code !== 11000) throw err;
      conversation = await Conversation.findOne({ property: property._id, enquirer: actor.id });
    }
  }

  const text = typeof body?.text === 'string' || typeof body?.message === 'string'
    ? body.text ?? body.message
    : '';
  const message = text.trim() ? await addMessage(actor, conversation, cleanText(text)) : null;
  const fresh = await Conversation.findById(conversation._id).lean();
  const users = await loadUsers([fresh.enquirer, fresh.owner, fresh.lastMessageBy]);
  const companies = await loadCompanies(users);
  return {
    created,
    conversation: presentConversation(actor, fresh, users, companies),
    message,
  };
};

const chatUrlFor = (role, conversationId) => {
  const path = CHAT_PATH_BY_ROLE[role];
  if (!path) return null;
  return `${config.frontendUrl.replace(/\/$/, '')}${path}/${conversationId}`;
};

const ownerRecipients = async (conversation) => {
  const [owner, property] = await Promise.all([
    User.findById(conversation.owner).select(IDENTITY_FIELDS).lean(),
    Property.findById(conversation.property).select('assignedTo').lean(),
  ]);
  const recipients = [];
  if (owner) {
    recipients.push({
      user: owner,
      email: owner.role === ROLES.ORGANISATION
        ? (owner.organisationProfile?.contactEmail || owner.email)
        : owner.email,
    });
  }
  if (property?.assignedTo && String(property.assignedTo) !== String(conversation.owner)) {
    const assigned = await User.findById(property.assignedTo).select(IDENTITY_FIELDS).lean();
    if (assigned?.email) recipients.push({ user: assigned, email: assigned.email });
  }
  return recipients;
};

const notifyOne = async (message) => {
  const claimed = await Message.findOneAndUpdate(
    { _id: message._id, readAt: null, emailSentAt: null },
    { $set: { emailSentAt: new Date() } }
  );
  if (!claimed) return;

  const conversation = await Conversation.findById(message.conversation).lean();
  if (!conversation) return;

  const senderIsEnquirer = String(message.sender) === String(conversation.enquirer);
  const recipients = senderIsEnquirer
    ? await ownerRecipients(conversation)
    : await User.findById(conversation.enquirer).select(IDENTITY_FIELDS).lean().then((user) => (
      user ? [{ user, email: user.email }] : []
    ));

  const users = await loadUsers([message.sender, ...recipients.map((row) => row.user._id)]);
  const companies = await loadCompanies(users);
  const sender = identityOf(users.get(String(message.sender)), companies);
  const snippet = message.body.length > 180 ? `${message.body.slice(0, 177)}…` : message.body;
  const seen = new Set();
  let sent = false;
  let attempted = false;

  for (const recipient of recipients) {
    const email = recipient.email?.trim().toLowerCase();
    const senderEmail = users.get(String(message.sender))?.email;
    if (!email || seen.has(email) || email === senderEmail) continue;
    seen.add(email);
    const url = chatUrlFor(recipient.user.role, conversation._id);
    if (!url) continue;
    attempted = true;
    const identity = identityOf(recipient.user, companies);
    const result = await sendMailSafely({
      to: email,
      ...chatMessageEmail({
        recipientName: identity.name,
        senderLabel: displayLabel(sender),
        propertyName: conversation.propertyName,
        snippet,
        chatUrl: url,
      }),
    });
    sent = sent || result.sent;
  }

  if (attempted && !sent) {
    await Message.updateOne({ _id: message._id, readAt: null }, { $unset: { emailSentAt: 1 } });
  }
};

const notifyUnreadMessages = async () => {
  const cutoff = new Date(Date.now() - config.chat.unreadEmailAfterMs);
  const pending = await Message.find({
    readAt: null,
    emailSentAt: null,
    createdAt: { $lte: cutoff },
  }).sort({ createdAt: 1 }).limit(50).lean();

  for (const message of pending) {
    try {
      await notifyOne(message);
    } catch (err) {
      console.error(`Chat email failed for message ${message._id}:`, err.message);
      await Message.updateOne({ _id: message._id, readAt: null }, { $unset: { emailSentAt: 1 } });
    }
  }
};

let sweepTimer;
const startUnreadEmailSweep = () => {
  if (sweepTimer) return;
  const run = () => {
    notifyUnreadMessages().catch((err) => console.error('Chat email sweep failed:', err.message));
  };
  sweepTimer = setInterval(run, SWEEP_EVERY_MS);
  if (typeof sweepTimer.unref === 'function') sweepTimer.unref();
  setTimeout(run, 15 * 1000).unref?.();
};

module.exports = {
  listConversations,
  unreadCount,
  getConversation,
  listMessages,
  sendMessage,
  startConversation,
  startUnreadEmailSweep,
};
