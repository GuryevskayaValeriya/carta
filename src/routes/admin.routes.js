const crypto = require('crypto');
const express = require('express');
const pool = require('../config/db');
const { resolveAdminAccess } = require('../utils/admin');
const { normalizeEmail, normalizePersonName } = require('../utils/auth');
const { syncPlacesJson } = require('../utils/places-json-sync');

const VALID_CATEGORIES = new Set(['food', 'fun', 'study', 'print']);

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    const access = await resolveAdminAccess(req);

    if (!access.isAuthenticated) {
      return res.status(401).json({ error: 'Сначала войдите в аккаунт' });
    }

    if (!access.isAdmin) {
      return res.status(403).json({ error: 'Доступ только для администраторов' });
    }

    req.adminUser = access.user;
    return next();
  } catch (error) {
    console.error('Failed to validate admin access:', error);
    return res.status(500).json({ error: 'Не удалось проверить права администратора' });
  }
});

router.get('/me', async (req, res) => {
  return res.json({ user: serializeUser(req.adminUser) });
});

router.get('/places', async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();

  try {
    const result = await pool.query(
      `
        SELECT
          places.*,
          (
            SELECT COUNT(*)::int
            FROM place_reviews
            WHERE place_reviews.place_id = places.id
          ) AS reviews_count,
          (
            SELECT COUNT(*)::int
            FROM place_favorites
            WHERE place_favorites.place_id = places.id
          ) AS favorites_count
        FROM places
        ORDER BY places.category ASC, places.name ASC
      `
    );

    const places = result.rows
      .map(serializePlace)
      .filter((place) => {
        if (!search) {
          return true;
        }

        return place.name.toLowerCase().includes(search) || place.address.toLowerCase().includes(search);
      });

    return res.json({ places });
  } catch (error) {
    console.error('Failed to load admin places:', error);
    return res.status(500).json({ error: 'Не удалось загрузить места' });
  }
});

router.get('/places/:id', async (req, res) => {
  try {
    const place = await getPlaceById(req.params.id);

    if (!place) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    return res.json({ place });
  } catch (error) {
    console.error('Failed to load admin place:', error);
    return res.status(500).json({ error: 'Не удалось загрузить место' });
  }
});

router.post('/places', async (req, res) => {
  let payload;

  try {
    payload = await normalizePlacePayload(req.body, { isCreate: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const existingPlace = await pool.query('SELECT id FROM places WHERE id = $1 LIMIT 1', [payload.id]);

    if (existingPlace.rowCount > 0) {
      return res.status(409).json({ error: 'Место с таким ID уже существует' });
    }

    const result = await pool.query(
      `
        INSERT INTO places (
          id, category, name, description, price_min, price_max, price_unit,
          hours, address, lat, lng, discount, tips, links
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
      buildPlaceQueryValues(payload)
    );

    await syncPlacesJson();

    return res.status(201).json({ place: serializePlace(result.rows[0]) });
  } catch (error) {
    console.error('Failed to create place:', error);
    return res.status(500).json({ error: 'Не удалось создать место' });
  }
});

router.patch('/places/:id', async (req, res) => {
  const { id } = req.params;
  let payload;

  try {
    payload = await normalizePlacePayload(req.body, { isCreate: false, fixedId: id });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const result = await pool.query(
      `
        UPDATE places
        SET category = $2,
            name = $3,
            description = $4,
            price_min = $5,
            price_max = $6,
            price_unit = $7,
            hours = $8,
            address = $9,
            lat = $10,
            lng = $11,
            discount = $12,
            tips = $13,
            links = $14
        WHERE id = $1
        RETURNING *
      `,
      buildPlaceQueryValues(payload)
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    await syncPlacesJson();

    return res.json({ place: serializePlace(result.rows[0]) });
  } catch (error) {
    console.error('Failed to update place:', error);
    return res.status(500).json({ error: 'Не удалось обновить место' });
  }
});

router.delete('/places/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM places WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    await syncPlacesJson();

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete place:', error);
    return res.status(500).json({ error: 'Не удалось удалить место' });
  }
});

router.get('/reviews', async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();

  try {
    const result = await pool.query(
      `
        SELECT
          place_reviews.id,
          place_reviews.place_id,
          place_reviews.user_id,
          place_reviews.rating,
          place_reviews.body,
          place_reviews.created_at,
          place_reviews.updated_at,
          places.name AS place_name,
          users.email AS user_email,
          users.first_name,
          users.last_name
        FROM place_reviews
        JOIN places ON places.id = place_reviews.place_id
        JOIN users ON users.id = place_reviews.user_id
        ORDER BY place_reviews.created_at DESC
      `
    );

    const reviews = result.rows
      .map(serializeAdminReview)
      .filter((review) => {
        if (!search) {
          return true;
        }

        return [review.placeName, review.authorName, review.userEmail, review.body]
          .some((value) => String(value || '').toLowerCase().includes(search));
      });

    return res.json({ reviews });
  } catch (error) {
    console.error('Failed to load admin reviews:', error);
    return res.status(500).json({ error: 'Не удалось загрузить отзывы' });
  }
});

router.patch('/reviews/:id', async (req, res) => {
  const reviewId = Number(req.params.id);
  const reviewPayload = normalizeReviewPayload(req.body);

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({ error: 'Некорректный отзыв' });
  }

  if (!reviewPayload.ok) {
    return res.status(400).json({ error: reviewPayload.error });
  }

  try {
    const result = await pool.query(
      `
        UPDATE place_reviews
        SET rating = $2,
            body = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [reviewId, reviewPayload.value.rating, reviewPayload.value.body]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    const review = await getAdminReviewById(reviewId);
    return res.json({ review });
  } catch (error) {
    console.error('Failed to update admin review:', error);
    return res.status(500).json({ error: 'Не удалось обновить отзыв' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  const reviewId = Number(req.params.id);

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({ error: 'Некорректный отзыв' });
  }

  try {
    const result = await pool.query('DELETE FROM place_reviews WHERE id = $1 RETURNING id', [reviewId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete admin review:', error);
    return res.status(500).json({ error: 'Не удалось удалить отзыв' });
  }
});

router.get('/users', async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();

  try {
    const result = await pool.query(
      `
        SELECT id, email, first_name, last_name, avatar_data, role, is_active, email_verified, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `
    );

    const users = result.rows
      .map(serializeUser)
      .filter((user) => {
        if (!search) {
          return true;
        }

        return [user.displayName, user.email]
          .some((value) => String(value || '').toLowerCase().includes(search));
      });

    return res.json({ users });
  } catch (error) {
    console.error('Failed to load admin users:', error);
    return res.status(500).json({ error: 'Не удалось загрузить пользователей' });
  }
});

router.patch('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const payload = normalizeUserPayload(req.body);

  if (!payload.ok) {
    return res.status(400).json({ error: payload.error });
  }

  if (req.adminUser.id === userId && (!payload.value.isActive || payload.value.role !== 'admin')) {
    return res.status(400).json({ error: 'Нельзя снять с себя права администратора или отключить свой аккаунт' });
  }

  try {
    const duplicateEmailResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
      [payload.value.email, userId]
    );

    if (duplicateEmailResult.rowCount > 0) {
      return res.status(409).json({ error: 'Пользователь с такой почтой уже существует' });
    }

    const result = await pool.query(
      `
        UPDATE users
        SET email = $2,
            first_name = $3,
            last_name = $4,
            role = $5,
            email_verified = $6,
            is_active = $7,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, first_name, last_name, avatar_data, role, is_active, email_verified, created_at, updated_at
      `,
      [
        userId,
        payload.value.email,
        payload.value.firstName,
        payload.value.lastName || null,
        payload.value.role,
        payload.value.isVerified,
        payload.value.isActive
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    return res.json({ user: serializeUser(result.rows[0]) });
  } catch (error) {
    console.error('Failed to update admin user:', error);
    return res.status(500).json({ error: 'Не удалось обновить пользователя' });
  }
});

function serializePlace(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description || '',
    price: {
      min: Number(row.price_min) || 0,
      max: Number(row.price_max) || 0,
      unit: row.price_unit || ''
    },
    hours: row.hours || '',
    address: row.address || '',
    coordinates: [Number(row.lat) || 0, Number(row.lng) || 0],
    discount: row.discount || '',
    tips: row.tips ? safeParseJson(row.tips, []) : [],
    links: row.links ? safeParseJson(row.links, {}) : {},
    reviewsCount: row.reviews_count !== undefined ? Number(row.reviews_count) || 0 : undefined,
    favoritesCount: row.favorites_count !== undefined ? Number(row.favorites_count) || 0 : undefined
  };
}

function serializeUser(row) {
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Пользователь';

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name || '',
    avatarData: row.avatar_data || '',
    displayName,
    role: row.role || 'user',
    isActive: row.is_active !== false,
    isVerified: Boolean(row.email_verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeAdminReview(row) {
  return {
    id: row.id,
    placeId: row.place_id,
    placeName: row.place_name,
    userId: row.user_id,
    userEmail: row.user_email,
    authorName: [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Пользователь',
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getPlaceById(placeId) {
  const result = await pool.query(
    `
      SELECT
        places.*,
        (
          SELECT COUNT(*)::int
          FROM place_reviews
          WHERE place_reviews.place_id = places.id
        ) AS reviews_count,
        (
          SELECT COUNT(*)::int
          FROM place_favorites
          WHERE place_favorites.place_id = places.id
        ) AS favorites_count
      FROM places
      WHERE places.id = $1
      LIMIT 1
    `,
    [placeId]
  );

  return result.rowCount > 0 ? serializePlace(result.rows[0]) : null;
}

async function getAdminReviewById(reviewId) {
  const result = await pool.query(
    `
      SELECT
        place_reviews.id,
        place_reviews.place_id,
        place_reviews.user_id,
        place_reviews.rating,
        place_reviews.body,
        place_reviews.created_at,
        place_reviews.updated_at,
        places.name AS place_name,
        users.email AS user_email,
        users.first_name,
        users.last_name
      FROM place_reviews
      JOIN places ON places.id = place_reviews.place_id
      JOIN users ON users.id = place_reviews.user_id
      WHERE place_reviews.id = $1
      LIMIT 1
    `,
    [reviewId]
  );

  return result.rowCount > 0 ? serializeAdminReview(result.rows[0]) : null;
}

async function normalizePlacePayload(input, { isCreate, fixedId }) {
  const name = String(input.name || '').trim();
  const category = String(input.category || '').trim();
  const hours = String(input.hours || '').trim();
  const address = String(input.address || '').trim();
  const priceMin = Number(input.price?.min ?? input.priceMin ?? input.price_min ?? 0);
  const priceMax = Number(input.price?.max ?? input.priceMax ?? input.price_max ?? 0);
  const priceUnit = String(input.price?.unit ?? input.priceUnit ?? input.price_unit ?? '').trim();
  const description = String(input.description || '').trim();
  const discount = String(input.discount || '').trim();
  const coordinates = Array.isArray(input.coordinates) ? input.coordinates : [input.coordinates?.[0], input.coordinates?.[1]];
  const lat = Number(input.lat ?? coordinates[0]);
  const lng = Number(input.lng ?? coordinates[1]);
  const tips = normalizeTips(input.tips);
  const links = normalizeLinks(input.links || { website: input.website });
  const baseId = isCreate ? String(input.id || '').trim() : fixedId;
  const id = isCreate ? await ensureUniquePlaceId(baseId || name) : fixedId;

  if (!id) {
    throw new Error('Нужен ID или название для генерации идентификатора');
  }

  if (!VALID_CATEGORIES.has(category)) {
    throw new Error('Выберите корректную категорию');
  }

  if (!name) {
    throw new Error('Введите название места');
  }

  if (!hours) {
    throw new Error('Введите часы работы');
  }

  if (!address) {
    throw new Error('Введите адрес');
  }

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('Широта должна быть в диапазоне от -90 до 90');
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Долгота должна быть в диапазоне от -180 до 180');
  }

  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax)) {
    throw new Error('Цены должны быть числами');
  }

  if (priceMin > priceMax) {
    throw new Error('Минимальная цена не может быть больше максимальной');
  }

  return {
    id,
    category,
    name,
    description,
    priceMin,
    priceMax,
    priceUnit: priceUnit || null,
    hours,
    address,
    lat,
    lng,
    discount: discount || null,
    tips,
    links
  };
}

function buildPlaceQueryValues(payload) {
  return [
    payload.id,
    payload.category,
    payload.name,
    payload.description || null,
    payload.priceMin,
    payload.priceMax,
    payload.priceUnit,
    payload.hours,
    payload.address,
    payload.lat,
    payload.lng,
    payload.discount,
    JSON.stringify(payload.tips),
    JSON.stringify(payload.links)
  ];
}

function normalizeTips(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeLinks(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const website = String(value.website || '').trim();
  return website ? { website } : {};
}

function normalizeReviewPayload(input) {
  const rating = Number(input.rating);
  const body = String(input.body || '')
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Оценка должна быть от 1 до 5' };
  }

  if (body.length < 10) {
    return { ok: false, error: 'Отзыв должен содержать минимум 10 символов' };
  }

  if (body.length > 500) {
    return { ok: false, error: 'Отзыв должен быть короче 500 символов' };
  }

  return {
    ok: true,
    value: { rating, body }
  };
}

function normalizeUserPayload(input) {
  const email = normalizeEmail(input.email);
  const firstName = normalizePersonName(input.firstName);
  const lastName = normalizePersonName(input.lastName);
  const role = String(input.role || '').trim() || 'user';
  const isVerified = Boolean(input.isVerified);
  const isActive = Boolean(input.isActive);

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Введите корректную почту' };
  }

  if (!firstName) {
    return { ok: false, error: 'Введите имя пользователя' };
  }

  if (!['user', 'admin'].includes(role)) {
    return { ok: false, error: 'Некорректная роль пользователя' };
  }

  return {
    ok: true,
    value: { email, firstName, lastName, role, isVerified, isActive }
  };
}

async function ensureUniquePlaceId(source) {
  const baseId = slugify(String(source || 'place'));

  if (!baseId) {
    return crypto.randomUUID();
  }

  let candidate = baseId;
  let suffix = 2;

  while (true) {
    const result = await pool.query('SELECT id FROM places WHERE id = $1 LIMIT 1', [candidate]);

    if (result.rowCount === 0) {
      return candidate;
    }

    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = router;
