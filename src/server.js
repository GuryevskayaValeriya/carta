require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const placesRoutes = require('./routes/places.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы (теперь из папки public)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes - Specific routes first!
app.get('/api/categories', async (req, res) => {
    // Hardcoded categories for now, or fetch from DB if needed
    res.json(['food', 'fun', 'study', 'print']);
});

// Прокси для маршрутизации (OSRM)
app.get('/api/route', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Route proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// General resource routes last
app.use('/api/places', placesRoutes);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
