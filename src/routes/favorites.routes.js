const express = require('express');
const pool = require('../config/db');
const { getCurrentUser } = require('../utils/session');

const router = express.Router();

router.get('/me/favorites', async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Сначала войдите в аккаунт' });
    }

    const result = await pool.query(
      `
        SELECT place_id
        FROM place_favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [user.id]
    );

    return res.json({
      placeIds: result.rows.map((row) => row.place_id)
    });
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return res.status(500).json({ error: 'Не удалось загрузить избранное' });
  }
});

router.post('/places/:placeId/favorite', async (req, res) => {
  const { placeId } = req.params;
  const user = await getAuthorizedUser(req, res);

  if (!user) {
    return;
  }

  try {
    const placeExists = await ensurePlaceExists(placeId);

    if (!placeExists) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    await pool.query(
      `
        INSERT INTO place_favorites (user_id, place_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, place_id) DO NOTHING
      `,
      [user.id, placeId]
    );

    return res.status(201).json({ placeId, isFavorite: true });
  } catch (error) {
    console.error('Failed to save favorite:', error);
    return res.status(500).json({ error: 'Не удалось добавить место в избранное' });
  }
});

router.delete('/places/:placeId/favorite', async (req, res) => {
  const { placeId } = req.params;
  const user = await getAuthorizedUser(req, res);

  if (!user) {
    return;
  }

  try {
    await pool.query(
      'DELETE FROM place_favorites WHERE user_id = $1 AND place_id = $2',
      [user.id, placeId]
    );

    return res.json({ placeId, isFavorite: false });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return res.status(500).json({ error: 'Не удалось убрать место из избранного' });
  }
});

async function ensurePlaceExists(placeId) {
  const result = await pool.query('SELECT id FROM places WHERE id = $1 LIMIT 1', [placeId]);
  return result.rowCount > 0;
}

async function getAuthorizedUser(req, res) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      res.status(401).json({ error: 'Сначала войдите в аккаунт' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to resolve current user for favorites:', error);
    res.status(500).json({ error: 'Не удалось проверить авторизацию' });
    return null;
  }
}

module.exports = router;
