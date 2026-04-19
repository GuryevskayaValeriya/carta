const pool = require('../config/db');
const { normalizeEmail } = require('./auth');
const { getCurrentUser } = require('./session');

function isAdminUser(user) {
  return Boolean(user && user.role === 'admin' && user.is_active !== false);
}

function getConfiguredAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL);
}

async function promoteConfiguredAdminIfNeeded(clientOrPool = pool, user) {
  const configuredAdminEmail = getConfiguredAdminEmail();

  if (!user || !configuredAdminEmail || normalizeEmail(user.email) !== configuredAdminEmail || user.role === 'admin') {
    return user;
  }

  const result = await clientOrPool.query(
    `
      UPDATE users
      SET role = 'admin', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [user.id]
  );

  return result.rows[0] || user;
}

async function resolveAdminAccess(req, clientOrPool = pool) {
  const user = await getCurrentUser(req, clientOrPool);

  if (!user) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false
    };
  }

  const effectiveUser = await promoteConfiguredAdminIfNeeded(clientOrPool, user);

  return {
    user: effectiveUser,
    isAuthenticated: true,
    isAdmin: isAdminUser(effectiveUser)
  };
}

module.exports = {
  getConfiguredAdminEmail,
  isAdminUser,
  promoteConfiguredAdminIfNeeded,
  resolveAdminAccess
};
