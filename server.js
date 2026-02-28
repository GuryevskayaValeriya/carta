const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ===== API ENDPOINTS =====

// Получить все места (с опциональной фильтрацией по категории и поиску)
app.get('/api/places', async (req, res) => {
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

    // Поиск на стороне клиента (для поддержки кириллицы)
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

// Получить одно место по ID
app.get('/api/places/:id', async (req, res) => {
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

// Получить доступные категории
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM places ORDER BY category');
    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error('Ошибка при получении категорий:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📡 API доступно: http://localhost:${PORT}/api/places`);
});
