const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Путь к базе данных
const DB_PATH = path.join(__dirname, 'carta.db');

// Данные для инициализации БД
const PLACES_DATA = [
  {
    id: 'food-1',
    category: 'food',
    name: 'Столовая ТюмГУ',
    description: 'Университетская столовая с бюджетными обедами',
    price_min: 60,
    price_max: 120,
    hours: '8:00–17:00',
    address: 'ул. Семакова, 10 (корпус ТюмГУ)',
    lat: 57.1456,
    lng: 65.5673,
    tips: JSON.stringify([
      'Комплексный обед 85₽ (суп, второе, компот)',
      'Меню обновляется каждый понедельник на сайте вуза',
      'После 15:00 выбор меньше, но и очередей нет'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/house/ulitsa_semakova_10/Z04YcQFjS0MCQFtvfXR0dnVhZA==/?ll=65.567309%2C57.145601&z=17'
    }),
    verified: 1
  },
  {
    id: 'food-2',
    category: 'food',
    name: 'Столовая ТИУ',
    description: 'Столовая Тюменского индустриального университета',
    price_min: 55,
    price_max: 110,
    hours: '8:30–16:30',
    address: 'ул. Володарского, 38',
    lat: 57.152506,
    lng: 65.544658,
    tips: JSON.stringify([
      'Плов 65₽ — самый популярный выбор',
      'Понедельник и четверг — самые загруженные дни',
      'Можно оплатить картой студента'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/house/volodarskogo_ulitsa_38/Z04YcQFjSEECQFtvfXR0cHRsZA==/?ll=65.570500%2C57.147800&z=17'
    }),
    verified: 1
  },


  {
    id: 'fun-1',
    category: 'fun',
    name: 'Цветной бульвар',
    description: 'Парк развлечений с бесплатными мероприятиями',
    price_min: 0,
    price_max: 500,
    hours: 'Круглосуточно',
    address: 'Цветной бульвар',
    lat: 57.151173,
    lng: 65.537692,
    tips: JSON.stringify([
      'Летом — много бесплатных концертов',
      'Можно прокатиться на аттракционах',
      'Рядом фонтан — красиво вечером'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/park/park_gagarina/207330381/?ll=65.550000%2C57.153000&z=15'
    }),
    verified: 1
  },
  {
    id: 'fun-2',
    category: 'fun',
    name: 'Кинотеатр «Космос»',
    description: 'Студенческие сеансы по выгодным ценам',
    price_min: 180,
    price_max: 350,
    hours: '10:00–23:00',
    address: 'ул. Республики, 100',
    lat: 57.134313,
    lng: 65.577316,
    tips: JSON.stringify([
      'Студенческий билет 220₽ в будние дни до 18:00',
      'Попкорн можно принести свой',
      'Забронировать места онлайн на сайте'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/org/kosmos/1486791835/?ll=65.569500%2C57.152500&z=17'
    }),
    verified: 1
  },
  {
    id: 'fun-3',
    category: 'fun',
    name: 'Настольный клуб «Игротека»',
    description: 'Более 150 настольных игр и уютная атмосфера',
    price_min: 0,
    price_max: 200,
    hours: '12:00–23:00',
    address: 'ул. Ленина, 38',
    lat: 57.155030,
    lng: 65.532082,
    tips: JSON.stringify([
      'Первый час бесплатно для студентов по вторникам',
      'Можно прийти одному — найдут компанию',
      'Чай и печенье включены в цену'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.564500%2C57.148900&z=17'
    }),
    verified: 1
  },
  {
    id: 'study-1',
    category: 'study',
    name: 'Библиотека им. М.Ю. Лермонтова',
    description: 'Главная городская библиотека с читальными залами',
    price_min: 0,
    price_max: 0,
    hours: '10:00–19:00, выходной — понедельник',
    address: 'ул. Республики, 60',
    lat: 57.150500,
    lng: 65.544865,
    tips: JSON.stringify([
      'Читальный зал на 2 этаже — тихий и просторный',
      'Бесплатный Wi-Fi и розетки у каждого стола',
      'Нужен паспорт для первого посещения'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/org/natsionalnaya_biblioteka_tiumenskoi_oblasti/1339764958/?ll=65.568900%2C57.151200&z=17'
    }),
    verified: 1
  },
  {
    id: 'study-2',
    category: 'study',
    name: 'Коворкинг «Точка кипения» (ТюмГУ)',
    description: 'Современный коворкинг для студентов и стартапов',
    price_min: 0,
    price_max: 0,
    hours: '9:00–21:00',
    address: 'ул. Семакова, 10 (корпус ТюмГУ)',
    lat: 57.159375,
    lng: 65.531265,
    tips: JSON.stringify([
      'Бесплатно для студентов ТюмГУ',
      'Переговорные можно бронировать онлайн',
      'Регулярно проводят бесплатные мастер-классы'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/house/ulitsa_semakova_10/Z04YcQFjS0MCQFtvfXR0dnVhZA==/?ll=65.567309%2C57.145601&z=17'
    }),
    verified: 1
  },
  {
    id: 'study-3',
    category: 'study',
    name: 'Кафе «Читай-Город»',
    description: 'Кафе в книжном магазине — тихо и с розетками',
    price_min: 100,
    price_max: 300,
    hours: '10:00–22:00',
    address: 'ул. Республики, 73',
    lat: 57.147316,
    lng: 65.553228,
    tips: JSON.stringify([
      'Можно сидеть час без чувства вины',
      'Бесплатный Wi-Fi и розетки',
      'Чай 90₽, пирожное 130₽'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.569200%2C57.151800&z=17'
    }),
    verified: 1
  },
  {
    id: 'study-4',
    category: 'study',
    name: 'Библиотека ТИУ',
    description: 'Университетская библиотека с современными залами',
    price_min: 0,
    price_max: 0,
    hours: '9:00–18:00',
    address: 'ул. Володарского, 38',
    lat: 57.152506,
    lng: 65.544658,
    tips: JSON.stringify([
      'Электронный каталог доступен онлайн',
      'Можно бронировать книги через личный кабинет',
      'Тихий зал на 3 этаже — идеально для подготовки'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/house/volodarskogo_ulitsa_38/Z04YcQFjSEECQFtvfXR0cHRsZA==/?ll=65.570500%2C57.147800&z=17'
    }),
    verified: 1
  },
  {
    id: 'print-1',
    category: 'print',
    name: 'Скрепка',
    description: 'Печать курсовых, дипломов, канцтовары',
    price_min: 0,
    price_max: 300,
    hours: '9:00–20:00',
    address: 'ул. 50 лет Октября, 36',
    lat: 57.146908,
    lng: 65.5779585,
    tips: JSON.stringify([
      'Можно оплатить картой',
      'Скан документов — 10₽ за страницу',
      'Менее загружена до 17:00'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/org/skrepka/204428098295/?ll=65.579923%2C57.143019&mode=search&sctx=ZAAAAAgBEAAaKAoSCRqnIarwYlBAEVoSoKaWkUxAEhIJqmQAqOJG4T8RuHcN%2BtLb1T8iBgABAgMEBSgKOABAk40GSAFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9FbmFibGVkPTFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9NYXhhZHY9MTViRHJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9SZWdpb25JZHM9WzEsMTAxNzRdYkByZWFycj1zY2hlbWVfTG9jYWwvR2VvdXBwZXIvQWR2ZXJ0cy9NYXhhZHZUb3BNaXgvTWF4YWR2Rm9yTWl4PTEwagJydZ0BzczMPaABAKgBAL0BbgL8%2BsIBEbui7NYGu9iuqKYC9%2FX0xvkFggIO0YHQutGA0LXQv9C60LCKAgCSAgCaAgxkZXNrdG9wLW1hcHM%3D&sll=65.579923%2C57.143019&sspn=0.037964%2C0.024012&text=%D1%81%D0%BA%D1%80%D0%B5%D0%BF%D0%BA%D0%B0&z=14.25'
    }),
    verified: 1
  },
  {
    id: 'print-2',
    category: 'print',
    name: 'Скрепка',
    description: 'Печать курсовых, дипломов, канцтовары',
    price_min: 0,
    price_max: 300,
    hours: '9:00–20:00',
    address: 'ул. Мельникайте, 80',
    lat: 57.142175,
    lng: 65.575732,
    tips: JSON.stringify([
      'Можно оплатить картой',
      'Скан документов — 10₽ за страницу',
      'Менее загружена до 17:00'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/org/skrepka/1792741691/?ll=65.579923%2C57.143019&mode=search&sctx=ZAAAAAgBEAAaKAoSCRqnIarwYlBAEVoSoKaWkUxAEhIJqmQAqOJG4T8RuHcN%2BtLb1T8iBgABAgMEBSgKOABAk40GSAFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9FbmFibGVkPTFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9NYXhhZHY9MTViRHJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9SZWdpb25JZHM9WzEsMTAxNzRdYkByZWFycj1zY2hlbWVfTG9jYWwvR2VvdXBwZXIvQWR2ZXJ0cy9NYXhhZHZUb3BNaXgvTWF4YWR2Rm9yTWl4PTEwagJydZ0BzczMPaABAKgBAL0BbgL8%2BsIBEbui7NYGu9iuqKYC9%2FX0xvkFggIO0YHQutGA0LXQv9C60LCKAgCSAgCaAgxkZXNrdG9wLW1hcHM%3D&sll=65.579923%2C57.143019&sspn=0.037964%2C0.024012&text=%D1%81%D0%BA%D1%80%D0%B5%D0%BF%D0%BA%D0%B0&z=14.25'
    }),
    verified: 1
  },
  {
    id: 'print-3',
    category: 'print',
    name: 'Копировальный центр «Фото-Плюс»',
    description: 'Фотопечать, постеры, ламинирование',
    price_min: 10,
    price_max: 1000,
    hours: '10:00–20:00',
    address: 'ул. Семакова, 12',
    lat: 57.159375,
    lng: 65.531265,
    discount: '10% с 9:00 до 12:00',
    tips: JSON.stringify([
      'Фото 10х15 — 15₽',
      'Ламинирование А4 — 50₽',
      'Можно заказать онлайн с доставкой'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.567500%2C57.145700&z=17'
    }),
    verified: 1
  }
];

// Подключение к БД и инициализация
const db = new sqlite3.Database(DB_PATH);

// Функция инициализации базы данных
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Создаём таблицу places
      db.run(`
        CREATE TABLE IF NOT EXISTS places (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price_min INTEGER,
          price_max INTEGER,
          price_unit TEXT,
          hours TEXT,
          address TEXT,
          lat REAL,
          lng REAL,
          discount TEXT,
          tips TEXT,
          links TEXT,
          verified INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) return reject(err);

        // Проверяем, есть ли данные в таблице
        db.get('SELECT COUNT(*) as count FROM places', (err, row) => {
          if (err) return reject(err);

          if (row.count === 0) {
            // Таблица пустая — заполняем данными
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO places (
                id, category, name, description, price_min, price_max, price_unit,
                hours, address, lat, lng, discount, tips, links, verified
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            PLACES_DATA.forEach((place, index) => {
              stmt.run(
                place.id,
                place.category,
                place.name,
                place.description,
                place.price_min,
                place.price_max,
                place.price_unit || null,
                place.hours,
                place.address,
                place.lat,
                place.lng,
                place.discount || null,
                place.tips,
                place.links,
                place.verified
              );
            });

            stmt.finalize((err) => {
              if (err) return reject(err);
              console.log(`✅ База данных инициализирована: ${PLACES_DATA.length} мест добавлено`);
              resolve();
            });
          } else {
            console.log(`✅ База данных подключена: ${row.count} мест в таблице`);
            resolve();
          }
        });
      });
    });
  });
}

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

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    // Преобразуем данные в формат фронтенда
    let places = rows.map(row => ({
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

// Запуск сервера с инициализацией БД
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
      console.log(`📡 API доступно: http://localhost:${PORT}/api/places`);
    });
  })
  .catch((err) => {
    console.error('❌ Ошибка инициализации БД:', err);
    process.exit(1);
  });
