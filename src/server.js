require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const adminRoutes = require('./routes/admin.routes');
const placesRoutes = require('./routes/places.routes');
const authRoutes = require('./routes/auth.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const { resolveAdminAccess } = require('./utils/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' }
});

const routeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов маршрутов.' }
});

app.get('/admin', async (req, res) => {
  try {
    const access = await resolveAdminAccess(req);
    if (!access.isAdmin) {
      return res.redirect('/');
    }
    return res.sendFile(path.join(__dirname, '../public/admin.html'));
  } catch (error) {
    console.error('Failed to open admin panel:', error);
    return res.redirect('/');
  }
});

app.get('/admin.html', async (req, res) => {
  try {
    const access = await resolveAdminAccess(req);
    if (!access.isAdmin) {
      return res.redirect('/');
    }
    return res.sendFile(path.join(__dirname, '../public/admin.html'));
  } catch (error) {
    console.error('Failed to open admin panel:', error);
    return res.redirect('/');
  }
});

app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '7d'
}));

app.get('/api/categories', async (req, res) => {
  res.json(['food', 'fun', 'study', 'print']);
});

app.get('/api/route', routeLimiter, async (req, res) => {
  const { from, to, profile = 'foot' } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const validProfiles = ['driving', 'foot'];
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
    console.error('Route proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', favoritesRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/places', placesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
