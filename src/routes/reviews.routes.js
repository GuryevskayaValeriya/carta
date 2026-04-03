const express = require('express');
const pool = require('../config/db');
const { getCurrentUser } = require('../utils/session');

const router = express.Router();

router.get('/places/:placeId/reviews', async (req, res) => {
  const { placeId } = req.params;

  try {
    const currentUser = await getCurrentUser(req);
    const placeResult = await pool.query('SELECT id FROM places WHERE id = $1 LIMIT 1', [placeId]);

    if (placeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    const summaryResult = await pool.query(
      `
        SELECT COUNT(*)::int AS reviews_count, ROUND(AVG(rating)::numeric, 1) AS average_rating
        FROM place_reviews
        WHERE place_id = $1
      `,
      [placeId]
    );

    const reviewsResult = await pool.query(
      `
        SELECT
          place_reviews.id,
          place_reviews.place_id,
          place_reviews.user_id,
          place_reviews.rating,
          place_reviews.body,
          place_reviews.created_at,
          place_reviews.updated_at,
          users.first_name,
          users.last_name
        FROM place_reviews
        JOIN users ON users.id = place_reviews.user_id
        WHERE place_reviews.place_id = $1
        ORDER BY place_reviews.created_at DESC
      `,
      [placeId]
    );

    const summaryRow = summaryResult.rows[0];

    return res.json({
      summary: {
        averageRating: summaryRow.average_rating === null ? null : Number(summaryRow.average_rating),
        reviewsCount: summaryRow.reviews_count
      },
      reviews: reviewsResult.rows.map((row) => serializeReview(row, currentUser))
    });
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return res.status(500).json({ error: 'Не удалось загрузить отзывы' });
  }
});

router.post('/places/:placeId/reviews', async (req, res) => {
  const { placeId } = req.params;
  const currentUser = await getAuthorizedUser(req, res);

  if (!currentUser) {
    return;
  }

  const validationError = validateReviewInput(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const rating = Number(req.body.rating);
  const body = normalizeReviewBody(req.body.body);

  try {
    const placeResult = await pool.query('SELECT id FROM places WHERE id = $1 LIMIT 1', [placeId]);
    if (placeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    const existingReviewResult = await pool.query(
      'SELECT id FROM place_reviews WHERE place_id = $1 AND user_id = $2 LIMIT 1',
      [placeId, currentUser.id]
    );

    if (existingReviewResult.rowCount > 0) {
      return res.status(409).json({ error: 'Вы уже оставили отзыв для этого места' });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO place_reviews (place_id, user_id, rating, body)
        VALUES ($1, $2, $3, $4)
        RETURNING id, place_id, user_id, rating, body, created_at, updated_at
      `,
      [placeId, currentUser.id, rating, body]
    );

    return res.status(201).json({
      review: serializeReview({
        ...insertResult.rows[0],
        first_name: currentUser.first_name,
        last_name: currentUser.last_name
      }, currentUser)
    });
  } catch (error) {
    console.error('Failed to create review:', error);
    return res.status(500).json({ error: 'Не удалось сохранить отзыв' });
  }
});

router.patch('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const currentUser = await getAuthorizedUser(req, res);

  if (!currentUser) {
    return;
  }

  const validationError = validateReviewInput(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const rating = Number(req.body.rating);
  const body = normalizeReviewBody(req.body.body);

  try {
    const updateResult = await pool.query(
      `
        UPDATE place_reviews
        SET rating = $2, body = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $4
        RETURNING id, place_id, user_id, rating, body, created_at, updated_at
      `,
      [reviewId, rating, body, currentUser.id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Отзыв не найден или недоступен' });
    }

    return res.json({
      review: serializeReview({
        ...updateResult.rows[0],
        first_name: currentUser.first_name,
        last_name: currentUser.last_name
      }, currentUser)
    });
  } catch (error) {
    console.error('Failed to update review:', error);
    return res.status(500).json({ error: 'Не удалось обновить отзыв' });
  }
});

router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const currentUser = await getAuthorizedUser(req, res);

  if (!currentUser) {
    return;
  }

  try {
    const deleteResult = await pool.query(
      'DELETE FROM place_reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [reviewId, currentUser.id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Отзыв не найден или недоступен' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete review:', error);
    return res.status(500).json({ error: 'Не удалось удалить отзыв' });
  }
});

async function getAuthorizedUser(req, res) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      res.status(401).json({ error: 'Войдите в аккаунт, чтобы оставить отзыв' });
      return null;
    }

    if (!user.email_verified) {
      res.status(403).json({ error: 'Сначала подтвердите почту' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to resolve authorized user:', error);
    res.status(500).json({ error: 'Не удалось проверить авторизацию' });
    return null;
  }
}

function validateReviewInput(input) {
  const rating = Number(input.rating);
  const body = normalizeReviewBody(input.body);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Оценка должна быть от 1 до 5';
  }

  if (body.length < 10) {
    return 'Отзыв должен содержать минимум 10 символов';
  }

  if (body.length > 500) {
    return 'Отзыв должен быть короче 500 символов';
  }

  return '';
}

function normalizeReviewBody(value) {
  return String(value || '')
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function serializeReview(review, currentUser) {
  return {
    id: review.id,
    placeId: review.place_id,
    rating: review.rating,
    body: review.body,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    authorName: getReviewAuthorName(review),
    isOwner: Boolean(currentUser && currentUser.id === review.user_id)
  };
}

function getReviewAuthorName(review) {
  const firstName = String(review.first_name || '').trim();
  const lastName = String(review.last_name || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || 'Пользователь';
}

module.exports = router;
