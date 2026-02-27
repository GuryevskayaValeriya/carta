# Инструкция по развёртыванию на Render с PostgreSQL

## Шаг 1: Создай базу данных PostgreSQL на Render

1. Зайди в панель управления Render: https://dashboard.render.com
2. Нажми **New** → **PostgreSQL**
3. Выбери бесплатный тариф (**Free**)
4. Укажи название (например: `carta-db`)
5. Нажми **Create Database**
6. После создания скопируй **Internal Database URL** (выглядит как `postgresql://user:password@host:5432/dbname`)

## Шаг 2: Настрой сервис Web Service

1. В панели Render нажми **New** → **Web Service**
2. Подключи свой GitHub репозиторий с проектом
3. Заполни настройки:

   | Поле | Значение |
   |------|----------|
   | **Name** | `carta` (или любое другое) |
   | **Region** | Frankfurt (ближе к Тюмени) |
   | **Branch** | `main` (или твоя основная ветка) |
   | **Root Directory** | (оставь пустым) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run init-db` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | `Free` |

4. В разделе **Environment Variables** добавь переменную:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Internal Database URL из шага 1 |
   | `NODE_ENV` | `production` |

5. Нажми **Create Web Service**

## Шаг 3: Проверка

После деплоя:
- Открой URL своего сервиса (например: `https://carta.onrender.com`)
- Проверь, что места загружаются и на ПК, и на мобильной версии
- Открой консоль браузера (F12) и убедись, что нет ошибок API

## Локальная разработка с PostgreSQL (опционально)

Если хочешь запускать проект локально с PostgreSQL:

1. Установи PostgreSQL на компьютер
2. Создай базу данных:
   ```sql
   CREATE DATABASE carta;
   ```
3. Создай файл `.env` в корне проекта:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/carta
   NODE_ENV=development
   ```
4. Запусти инициализацию БД:
   ```bash
   npm run init-db
   ```
5. Запусти сервер:
   ```bash
   npm start
   ```

## Важные заметки

- **PostgreSQL на бесплатном тарифе Render** "засыпает" после 15 минут бездействия. Первый запрос после простоя может занять 30-60 секунд.
- **Данные сохраняются** между деплоями (в отличие от SQLite).
- **API работает одинаково** для ПК и мобильной версии — оба используют `/api` относительно текущего домена.
