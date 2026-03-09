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

// API Routes
app.use('/api/places', placesRoutes);

app.get('/api/categories', async (req, res) => {
    // Hardcoded categories for now, or fetch from DB if needed
    res.json(['food', 'fun', 'study', 'print']);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
