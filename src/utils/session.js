const pool = require('../config/db');
const { hashSessionToken } = require('./auth');

const SESSION_COOKIE_NAME = 'studentmap_session';

function parseCookies(headerValue) {
  return String(headerValue || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

async function getCurrentUser(req, clientOrPool = pool) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const result = await clientOrPool.query(
    `
      SELECT users.*
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
        AND auth_sessions.expires_at > NOW()
        AND users.is_active = true
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

module.exports = {
  getCurrentUser,
  parseCookies,
  SESSION_COOKIE_NAME
};
