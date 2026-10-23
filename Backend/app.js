const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const connectDB = require('./src/config/db');
const activityLogger = require('./src/middleware/activityLogger');
const commonRoutes = require('./src/modules/common/routes/common.routes');
const userRoutes = require('./src/modules/user/routes/user.routes');
const organisationRoutes = require('./src/modules/organisation/routes/organisation.routes');
const organisationAdminRoutes = require('./src/modules/organisation-admin/routes/organisationAdmin.routes');
const organisationUserRoutes = require('./src/modules/organisation-user/routes/organisationUser.routes');
const adminRoutes = require('./src/modules/admin/routes/admin.routes');
const chatRoutes = require('./src/modules/chat/routes/chat.routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { verifyMailTransport } = require('./src/utils/email.service');

const app = express();

app.set('trust proxy', config.trustProxy);
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(activityLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

app.use('/api/common', commonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/organisation-admins', organisationAdminRoutes);
app.use('/api/organisation-users', organisationUserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    if (config.mail.verifyOnStartup) verifyMailTransport();
    const { startUnreadEmailSweep } = require('./src/modules/chat/services/chat.service');
    startUnreadEmailSweep();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
