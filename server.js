const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Подключение к БД
const db = new sqlite3.Database(path.join(__dirname, 'carta.db'));

// ===== API ENDPOINTS =====

// Получить все места (с опциональной фильтрацией по категории и поиску)
app.get('/api/places', (req, res) => {
  const { category, search } = req.query;
  
  let query = 'SELECT * FROM places WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR address LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    // Преобразуем данные в формат фронтенда
    const places = rows.map(row => ({
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

    res.json(places);
  });
});

// Получить одно место по ID
app.get('/api/places/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM places WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

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
  });
});

// Получить доступные категории
app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM places ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    const categories = rows.map(row => row.category);
    res.json(categories);
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📡 API доступно: http://localhost:${PORT}/api/places`);
});
