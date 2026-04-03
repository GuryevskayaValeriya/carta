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
  normalizePersonName,
  verifyPassword
} = require('../utils/auth');
const { isMailConfigured, sendVerificationCodeEmail } = require('../utils/mail');
const { getCurrentUser, parseCookies, SESSION_COOKIE_NAME } = require('../utils/session');

const router = express.Router();

const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 30);
const VERIFICATION_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);

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
  const displayName = [user.first_name, user.last_name]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .trim() || 'Пользователь';

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name || '',
    avatarData: user.avatar_data || '',
    displayName,
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
    await removeExpiredAuthArtifacts();
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

router.patch('/me', async (req, res) => {
  const firstName = normalizePersonName(req.body.firstName);
  const lastName = normalizePersonName(req.body.lastName);
  const avatarValidation = normalizeAvatarData(req.body.avatarData);

  if (!firstName) {
    return res.status(400).json({ error: 'Введите имя' });
  }

  if (!avatarValidation.ok) {
    return res.status(400).json({ error: avatarValidation.error });
  }

  try {
    await removeExpiredAuthArtifacts();
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Сначала войдите в аккаунт' });
    }

    const result = await pool.query(
      `
        UPDATE users
        SET first_name = $2,
            last_name = $3,
            avatar_data = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [user.id, firstName, lastName || null, avatarValidation.value]
    );

    return res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    console.error('Profile update failed:', error);
    return res.status(500).json({ error: 'Не удалось обновить профиль' });
  }
});

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const firstName = normalizePersonName(req.body.firstName);
  const lastName = normalizePersonName(req.body.lastName);
  const password = String(req.body.password || '');

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Введите корректный email' });
  }

  if (!firstName) {
    return res.status(400).json({ error: 'Введите имя' });
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
          SET password_hash = $2, first_name = $3, last_name = $4, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [user.id, passwordHash, firstName, lastName || null]
      );
      user = updatedUserResult.rows[0];
      code = await issueVerificationCode(client, user);
    } else {
      const insertedUserResult = await client.query(
        `
          INSERT INTO users (id, email, first_name, last_name, password_hash, email_verified)
          VALUES ($1, $2, $3, $4, $5, false)
          RETURNING *
        `,
        [crypto.randomUUID(), email, firstName, lastName || null, passwordHash]
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

function normalizeAvatarData(value) {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }

  if (typeof value !== 'string') {
    return { ok: false, error: 'Некорректный формат аватарки' };
  }

  const trimmedValue = value.trim();
  const isSupportedImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(trimmedValue);

  if (!isSupportedImage) {
    return { ok: false, error: 'Поддерживаются только PNG, JPG, WEBP и GIF' };
  }

  if (trimmedValue.length > 1_500_000) {
    return { ok: false, error: 'Аватарка слишком большая. Выберите файл до 1 МБ' };
  }

  return { ok: true, value: trimmedValue };
}

module.exports = router;
