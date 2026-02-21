# STUDENTMAP Тюмень — Backend

## Структура

- `server.js` — Express сервер с API
- `init-db.js` — скрипт инициализации базы данных
- `carta.db` — SQLite база данных
- `package.json` — зависимости проекта

## API Endpoints

### GET /api/places
Получить все места. Поддерживает фильтрацию:
- `?category=food` — фильтрация по категории (food, fun, study, print, work)
- `?search=столовая` — поиск по названию и адресу
- `?category=food&search=ТюмГУ` — комбинированный запрос

### GET /api/places/:id
Получить конкретное место по ID (например, `/api/places/food-1`)

### GET /api/categories
Получить список всех категорий

## Запуск

```bash
# Установка зависимостей
npm install

# Инициализация БД (если нужно создать/обновить данные)
npm run init-db

# Запуск сервера
npm start
```

Сервер запустится на `http://localhost:3000`

## Фронтенд

После запуска сервера откройте `index.html` в браузере. Данные будут загружаться из API.
