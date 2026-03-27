const crypto = require('crypto');
const express = require('express');
const pool = require('../config/db');
const {
  createSessionToken,
  createVerificationCode,
  hashPassword,
  hashSessionToken,
  hashVerificationCode,
  normalizeEmail,
  verifyPassword
} = require('../utils/auth');
const { isMailConfigured, sendVerificationCodeEmail } = require('../utils/mail');

const router = express.Router();

const SESSION_COOKIE_NAME = 'studentmap_session';
const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 30);
const VERIFICATION_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);

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

function setSessionCookie(res, token) {
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  ];

  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearSessionCookie(res) {
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    isVerified: Boolean(user.email_verified),
    createdAt: user.created_at
  };
}

async function removeExpiredAuthArtifacts(clientOrPool = pool) {
  await clientOrPool.query('DELETE FROM auth_sessions WHERE expires_at <= NOW()');
  await clientOrPool.query(
    'DELETE FROM email_verifications WHERE expires_at <= NOW() OR used_at IS NOT NULL'
  );
}

async function createSessionForUser(client, userId) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);

  await client.query(
    `
      INSERT INTO auth_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, NOW() + ($3 || ' days')::interval)
    `,
    [userId, tokenHash, SESSION_DAYS]
  );

  return { token };
}

async function getCurrentUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return null;
  }

  await removeExpiredAuthArtifacts();

  const tokenHash = hashSessionToken(sessionToken);
  const result = await pool.query(
    `
      SELECT users.*
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
        AND auth_sessions.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

async function issueVerificationCode(client, user) {
  const code = createVerificationCode();
  const codeHash = hashVerificationCode(code);

  await client.query(
    `
      DELETE FROM email_verifications
      WHERE user_id = $1
        AND purpose = 'register'
        AND used_at IS NULL
    `,
    [user.id]
  );

  await client.query(
    `
      INSERT INTO email_verifications (user_id, email, code_hash, purpose, expires_at)
      VALUES ($1, $2, $3, 'register', NOW() + ($4 || ' minutes')::interval)
    `,
    [user.id, user.email, codeHash, VERIFICATION_TTL_MINUTES]
  );

  return code;
}

router.get('/me', async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Failed to resolve current user:', error);
    return res.status(500).json({ error: 'Не удалось загрузить данные пользователя' });
  }
});

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Введите корректный email' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
  }

  if (!isMailConfigured()) {
    return res.status(500).json({ error: 'Почтовая отправка не настроена на сервере' });
  }

  let client;
  let code;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await removeExpiredAuthArtifacts(client);

    const existingResult = await client.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1 FOR UPDATE',
      [email]
    );

    const passwordHash = await hashPassword(password);
    let user;

    if (existingResult.rowCount > 0) {
      user = existingResult.rows[0];

      if (user.email_verified) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
      }

      const updatedUserResult = await client.query(
        `
          UPDATE users
          SET password_hash = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [user.id, passwordHash]
      );
      user = updatedUserResult.rows[0];
      code = await issueVerificationCode(client, user);
    } else {
      const insertedUserResult = await client.query(
        `
          INSERT INTO users (id, email, password_hash, email_verified)
          VALUES ($1, $2, $3, false)
          RETURNING *
        `,
        [crypto.randomUUID(), email, passwordHash]
      );
      user = insertedUserResult.rows[0];
      code = await issueVerificationCode(client, user);
    }

    await client.query('COMMIT');
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Не удалось начать регистрацию' });
  } finally {
    if (client) {
      client.release();
    }
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] verification code for ${email}: ${code}`);
    }
    await sendVerificationCodeEmail({ email, code });

    return res.status(201).json({
      message: 'Код подтверждения отправлен',
      email
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return res.status(500).json({ error: 'Не удалось отправить письмо с кодом' });
  }
});

router.post('/resend-code', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Введите корректный email' });
  }

  if (!isMailConfigured()) {
    return res.status(500).json({ error: 'Почтовая отправка не настроена на сервере' });
  }

  let client;
  let code;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await removeExpiredAuthArtifacts(client);

    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1 FOR UPDATE',
      [email]
    );

    if (userResult.rowCount === 0 || userResult.rows[0].email_verified) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Для этой почты нет ожидающей регистрации' });
    }

    code = await issueVerificationCode(client, userResult.rows[0]);
    await client.query('COMMIT');
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Failed to resend verification code:', error);
    return res.status(500).json({ error: 'Не удалось отправить код повторно' });
  } finally {
    if (client) {
      client.release();
    }
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] verification code for ${email}: ${code}`);
    }
    await sendVerificationCodeEmail({ email, code });

    return res.json({ message: 'Код подтверждения отправлен повторно', email });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return res.status(500).json({ error: 'Не удалось отправить письмо с кодом' });
  }
});

router.post('/verify-email', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ error: 'Нужны email и код подтверждения' });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await removeExpiredAuthArtifacts(client);

    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1 FOR UPDATE',
      [email]
    );

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];
    const verificationResult = await client.query(
      `
        SELECT *
        FROM email_verifications
        WHERE user_id = $1
          AND purpose = 'register'
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [user.id]
    );

    if (verificationResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Код подтверждения истёк или не найден' });
    }

    const verification = verificationResult.rows[0];
    if (verification.code_hash !== hashVerificationCode(code)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    await client.query(
      'UPDATE email_verifications SET used_at = NOW() WHERE id = $1',
      [verification.id]
    );

    const updatedUserResult = await client.query(
        `
        UPDATE users
        SET email_verified = true, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [user.id]
    );

    const { token } = await createSessionForUser(client, user.id);
    await client.query('COMMIT');

    setSessionCookie(res, token);
    return res.json({ user: sanitizeUser(updatedUserResult.rows[0]) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Email verification failed:', error);
    return res.status(500).json({ error: 'Не удалось подтвердить почту' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Нужны email и пароль' });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await removeExpiredAuthArtifacts(client);

    const userResult = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = userResult.rows[0];
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.email_verified) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Сначала подтвердите почту' });
    }

    const { token } = await createSessionForUser(client, user.id);
    await client.query('COMMIT');

    setSessionCookie(res, token);
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Не удалось войти в аккаунт' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post('/logout', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  try {
    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);
      await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenHash]);
    }

    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return res.status(500).json({ error: 'Не удалось выйти из аккаунта' });
  }
});

module.exports = router;
