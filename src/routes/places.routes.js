const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Получить все места
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT * FROM places WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category && category !== 'all') {
    query += ' AND category = $' + paramIndex++;
    params.push(category);
  }

  try {
    const result = await pool.query(query, params);
    let places = result.rows.map(row => ({
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
      coordinates: [row.lat, row.lng],
      discount: row.discount,
      tips: row.tips ? JSON.parse(row.tips) : [],
      links: row.links ? JSON.parse(row.links) : {},
      verified: !!row.verified
    }));

    if (search) {
      const searchTerm = search.toLowerCase();
      places = places.filter(place =>
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
      );
    }

    res.json(places);
  } catch (err) {
    console.error('Ошибка при получении мест:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить одно место
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM places WHERE id = $1', [id]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    const place = {
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
      coordinates: [row.lat, row.lng],
      discount: row.discount,
      tips: row.tips ? JSON.parse(row.tips) : [],
      links: row.links ? JSON.parse(row.links) : {},
      verified: !!row.verified
    };

    res.json(place);
  } catch (err) {
    console.error('Ошибка при получении места:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
