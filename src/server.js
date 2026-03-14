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

// Прокси для маршрутизации (GraphHopper)
app.get('/api/route', async (req, res) => {
  const { from, to, profile = 'foot' } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const validProfiles = ['driving', 'foot', 'bike'];
  const routeProfile = validProfiles.includes(profile) ? profile : 'foot';
  
  const ghProfile = routeProfile === 'driving' ? 'car' : routeProfile;
  const apiKey = process.env.GRAPHHOPPER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GraphHopper API key not configured' });
  }

  try {
    const [fromLng, fromLat] = from.split(',');
    const [toLng, toLat] = to.split(',');
    const url = `https://graphhopper.com/api/1/route?point=${fromLat},${fromLng}&point=${toLat},${toLng}&profile=${ghProfile}&instructions=false&points_encoded=false&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!data.paths || !data.paths[0]) {
      throw new Error('No route found');
    }

    const route = data.paths[0];
    res.json({
      routes: [{
        geometry: {
          coordinates: route.points.coordinates.map(c => [c[0], c[1]])
        },
        duration: route.time / 1000,
        distance: route.distance
      }]
    });
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
