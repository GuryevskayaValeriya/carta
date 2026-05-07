const express = require('express');
const router = express.Router();
const pool = require('../config/db');

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function formatPlaceRow(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: {
      min: row.price_min,
      max: row.price_max,
      unit: row.price_unit || undefined
    },
    hours: row.hours,
    address: row.address,
    coordinates: row.lat != null && row.lng != null ? [row.lat, row.lng] : null,
    discount: row.discount,
    tips: safeParseJson(row.tips, []),
    links: safeParseJson(row.links, {})
  };
}

router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT * FROM places WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category && category !== 'all') {
    query += ' AND category = $' + paramIndex++;
    params.push(category);
  }

  if (search) {
    query += ' AND (name ILIKE $' + paramIndex + ' OR address ILIKE $' + paramIndex + ')';
    params.push('%' + search + '%');
    paramIndex++;
  }

  try {
    const result = await pool.query(query, params);
    const places = result.rows.map(formatPlaceRow);
    res.json(places);
  } catch (err) {
    console.error('Ошибка при получении мест:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM places WHERE id = $1', [id]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    res.json(formatPlaceRow(row));
  } catch (err) {
    console.error('Ошибка при получении места:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
