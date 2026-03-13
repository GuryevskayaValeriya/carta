# STUDENTMAP Тюмень — Контекст проекта

## Обзор проекта

**STUDENTMAP** — это веб-приложение карты студенческих мест Тюмени. Позволяет студентам находить бюджетные места для учёбы, еды, досуга и печати документов.

### Технологии

| Компонент | Технология |
|-----------|------------|
| **Backend** | Node.js + Express.js |
| **База данных** | PostgreSQL (с поддержкой Render) |
| **Frontend** | Vanilla JS + Leaflet (карты) |
| **Стили** | CSS3 (адаптивный дизайн) |
| **Развёртывание** | Render (Web Service + PostgreSQL) |

### Архитектура

```
carta/
├── src/
│   ├── server.js          # Точка входа Express-сервера
│   ├── config/
│   │   └── db.js          # Подключение к PostgreSQL (Pool)
│   └── routes/
│       └── places.routes.js # API маршруты для мест
├── database/
│   ├── init.js            # Скрипт инициализации БД
│   ├── schema.sql         # Схема таблицы places
│   └── places.json        # Начальные данные (места)
├── public/
│   ├── index.html         # HTML-разметка
│   ├── css/
│   │   ├── style.css      # Основные стили (desktop + mobile)
│   │   └── mobile-fixes.css # Мобильные исправления
│   └── js/
│       └── app.js         # Frontend-логика (Leaflet, UI)
└── .env                   # Переменные окружения (не в git)
```

## Команды для разработки

### Установка зависимостей
```bash
npm install
```

### Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=development
PORT=3000
```

### Инициализация базы данных
```bash
npm run init-db           # Первая инициализация
npm run reset-db          # Полный сброс и перезапись данных
```

### Запуск сервера
```bash
npm start                 # Продакшен-режим
npm run dev               # Режим разработки (то же самое)
```

### API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/places` | Получить все места |
| `GET` | `/api/places?category=food` | Фильтр по категории |
| `GET` | `/api/places?search=текст` | Поиск по названию/адресу |
| `GET` | `/api/places/:id` | Получить конкретное место |
| `GET` | `/api/categories` | Получить список категорий |

## Структура данных

### Таблица `places`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | TEXT PRIMARY KEY | Уникальный идентификатор |
| `category` | TEXT NOT NULL | Категория: `food`, `fun`, `study`, `print` |
| `name` | TEXT NOT NULL | Название места |
| `description` | TEXT | Описание |
| `price_min` | INTEGER | Минимальная цена |
| `price_max` | INTEGER | Максимальная цена |
| `price_unit` | TEXT | Единица измерения цены |
| `hours` | TEXT | Часы работы |
| `address` | TEXT | Адрес |
| `lat` | REAL | Широта |
| `lng` | REAL | Долгота |
| `discount` | TEXT | Скидки |
| `tips` | TEXT (JSON) | Советы/лайфхаки (массив) |
| `links` | TEXT (JSON) | Ссылки (map, website) |
| `verified` | BOOLEAN | Проверенное место |

### Категории мест

| Категория | Эмодзи | Цвет | Описание |
|-----------|--------|------|----------|
| `food` | 🍜 | #fbbf24 | Еда (столовые, кафе) |
| `fun` | 🎉 | #a855f7 | Досуг (парки, развлечения) |
| `study` | 📚 | #34d399 | Учёба (библиотеки, коворкинги) |
| `print` | 🖨️ | #3b82f6 | Печать (типографии) |

## Frontend-особенности

### Адаптивный дизайн
- **Desktop (>768px)**: Боковая панель слева + карта
- **Mobile (≤768px)**: Верхняя панель фильтров + карта + нижняя панель поиска

### Ключевые компоненты JS (`app.js`)
- `initMap()` — инициализация Leaflet карты
- `loadPlaces()` — загрузка мест из API
- `filterPlaces()` — фильтрация по категории и поиску
- `renderAll()` — рендер маркеров, сайдбара, мобильных результатов
- `onPlaceSelect(place)` — выбор места (центрирование карты + popup)

### Состояние приложения
```javascript
let PLACES = [];           // Все места
let filteredPlaces = [];   // Отфильтрованные места
let map = null;            // Leaflet map instance
let markers = [];          // Массив маркеров
let activeMarker = null;   // Активное место
let currentCategory = 'all';
let currentSearch = '';
```

## Практики разработки

### Код-стиль
- **Backend**: CommonJS модули, async/await для БД-запросов
- **Frontend**: Vanilla JS, функциональный подход, состояние в глобальных переменных
- **CSS**: BEM-подобные классы, mobile-first медиа-запросы

### Тестирование
- Явных тестов нет
- Проверка через ручной запуск и открытие в браузере

### Развёртывание на Render
1. Создать PostgreSQL базу на Render
2. Создать Web Service с подключением к GitHub
3. Указать переменные окружения: `DATABASE_URL`, `NODE_ENV`
4. Build: `npm install`, Start: `npm start`

**Важно**: PostgreSQL на бесплатном тарифе Render "засыпает" после 15 минут бездействия (первый запрос 30-60 сек).

## Файлы конфигурации

### `.gitignore`
Игнорирует: `.env`, `node_modules/`, `*.log`, IDE-файлы, ОС-файлы

### `package.json`
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "node src/server.js",
    "init-db": "node database/init.js",
    "reset-db": "node database/init.js --reset"
  }
}
```

## Примечания

- Проект использует **PostgreSQL** с поддержкой работы в cloud (Render)
- API работает одинаково для desktop и mobile версий
- Данные мест хранятся в `database/places.json` и загружаются при инициализации БД
- Для локальной разработки требуется локальный PostgreSQL или другой совместимый сервер БД
