require('dotenv').config();
const { Pool } = require('pg');

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Данные для инициализации БД
const PLACES_DATA = [
  {
    id: 'food-1',
    category: 'food',
    name: 'Столовая Гренки',
    description: 'Столовая с бюджетными ценами',
    price_min: 0,
    price_max: 800,
    hours: '10:00–17:00',
    address: 'ул. Пржевальского, 36',
    lat: 57.139339,
    lng: 65.586029,
    tips: JSON.stringify([
      'Скидка студентам в любое время',
      'Вкусный и сытный обед по доступной цене'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D0%B3%D1%80%D0%B5%D0%BD%D0%BA%D0%B8/firm/70000001084113168/65.585957%2C57.139347?m=65.618754%2C57.142608%2F12.54'
    }),
    verified: true
  },
  {
    id: 'food-2',
    category: 'food',
    name: 'Столовая Самовар',
    description: 'Столовая с бюджетными ценами',
    price_min: 0,
    price_max: 800,
    hours: '9:00–18:00',
    address: 'ул. Станислава Карнацевича, 4',
    lat: 57.104070,
    lng: 65.572414,
    tips: JSON.stringify([
      'Комплексный обед за 250-300 р.',
      'Вкусный и сытный обед по доступной цене'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%81%D0%B0%D0%BC%D0%BE%D0%B2%D0%B0%D1%80/firm/70000001023729240/65.572395%2C57.10407?m=65.572395%2C57.10407%2F12.54'
    }),
    verified: true
  },
  {
    id: 'food-3',
    category: 'food',
    name: 'Кафе "Хинкальцы"',
    description: 'Кафе грузинской кухни',
    price_min: 0,
    price_max: 500,
    hours: '11:00–23:00',
    address: 'ул. Республики, 149',
    lat: 57.138522,
    lng: 65.569475,
    tips: JSON.stringify([
      'Хинкали по 40-50 р/шт',
      'Вкусный и быстрый обед или ужин'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%85%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D1%8C%D1%86%D1%8B/firm/70000001101569542/65.569435%2C57.138524?m=65.572395%2C57.104096%2F12.54'
    }),
    verified: true
  },
  {
    id: 'food-4',
    category: 'food',
    name: 'Кафе "Хинкальцы"',
    description: 'Кафе грузинской кухни',
    price_min: 0,
    price_max: 500,
    hours: '11:00–23:00',
    address: 'ул. Республики, 46',
    lat: 57.154222,
    lng: 65.537676,
    tips: JSON.stringify([
      'Хинкали по 40-50 р/шт',
      'Вкусный и быстрый обед или ужин'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%85%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D1%8C%D1%86%D1%8B/firm/70000001111117324?m=65.572395%2C57.104096%2F11'
    }),
    verified: true
  },
  {
    id: 'fun-1',
    category: 'fun',
    name: 'Парк им. Ю.А. Гагарина',
    description: 'Большой парк с лавочками и бесплатными мероприятиями',
    price_min: 0,
    price_max: 0,
    hours: 'Круглосуточно',
    address: 'ул. Гагарина',
    lat: 57.173864,
    lng: 65.617471,
    tips: JSON.stringify([
      'Красивые пейзажи зимой и летом',
      'Подойдет для прогулки на природе',
      'Каждую субботу в 9 утра - пробежка от "5 верст"'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D0%B3%D0%B0%D0%B3%D0%B0%D1%80%D0%B8%D0%BD%D0%B0?m=65.618754%2C57.171309%2F14.31'
    }),
    verified: true
  },
  {
    id: 'fun-2',
    category: 'fun',
    name: 'Цветной бульвар',
    description: 'Парк развлечений',
    price_min: 0,
    price_max: 500,
    hours: 'Круглосуточно',
    address: 'Цветной бульвар',
    lat: 57.151164,
    lng: 65.537705,
    tips: JSON.stringify([
      'С колеса обозрения открывается прекрасный вид на город',
      'Можно посидеть на лавочках в тени'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%86%D0%B2%D0%B5%D1%82%D0%BD%D0%BE%D0%B9%20%D0%B1%D1%83%D0%BB%D1%8C%D0%B2%D0%B0%D1%80/firm/70000001103170744/65.538672%2C57.150488?m=65.539915%2C57.150623%2F16.17'
    }),
    verified: true
  },
  {
    id: 'study-1',
    category: 'study',
    name: 'Библиотека им. М.Ю. Лермонтова',
    description: 'Главная городская библиотека с читальными залами',
    price_min: 0,
    price_max: 500,
    hours: '11:00–19:00',
    address: 'ул. Орджоникидзе, 59',
    lat: 57.150500,
    lng: 65.544865,
    tips: JSON.stringify([
      'Приятная и тихая атмосфера',
      'Проводятся интересные экскурсии',
      'Можно взять нужные для учебы книги'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D0%B1%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B0%20%D0%BC%D0%B5%D0%BD%D0%B4%D0%B5%D0%BB%D0%B5%D0%B5%D0%B2%D0%B0/firm/1830115629708503?m=65.543748%2C57.150232%2F18'
    }),
    verified: true
  },
  {
    id: 'print-1',
    category: 'print',
    name: 'Типография "Скрепка"',
    description: 'Печать курсовых, дипломов, плакатов',
    price_min: 0,
    price_max: 500,
    hours: '9:00–18:00',
    address: 'ул. Мельникайте, 80',
    lat: 57.142067,
    lng: 65.575293,
    tips: JSON.stringify([
      'Быстрая печать курсовых/дипломов',
      'Большой ассортимент канцтоваров для учебы'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%81%D0%BA%D1%80%D0%B5%D0%BF%D0%BA%D0%B0/firm/1830115630090310/65.575652%2C57.142139?m=65.575774%2C57.14205%2F18'
    }),
    verified: true
  },
  {
    id: 'print-2',
    category: 'print',
    name: 'Типография "Скрепка"',
    description: 'Печать курсовых, дипломов, плакатов',
    price_min: 0,
    price_max: 500,
    hours: '9:00–18:00',
    address: 'ул. 50 лет Октября, 36',
    lat: 57.14708,
    lng: 65.577397,
    tips: JSON.stringify([
      'Быстрая печать курсовых/дипломов',
      'Большой ассортимент канцтоваров для учебы'
    ]),
    links: JSON.stringify({
      map: 'https://2gis.ru/tyumen/search/%D1%81%D0%BA%D1%80%D0%B5%D0%BF%D0%BA%D0%B0/firm/70000001042766697?m=65.577531%2C57.142612%2F14.72'
    }),
    verified: true
  },
];

async function resetDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Подключение к базе данных установлено');

    // Удаляем таблицу places
    await client.query('DROP TABLE IF EXISTS places CASCADE');
    console.log('🗑️ Таблица places удалена');

    // Создаём таблицу places заново
    await client.query(`
      CREATE TABLE places (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price_min INTEGER DEFAULT 0,
        price_max INTEGER DEFAULT 0,
        price_unit TEXT,
        hours TEXT,
        address TEXT,
        lat REAL,
        lng REAL,
        discount TEXT,
        tips TEXT,
        links TEXT,
        verified BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Таблица places создана заново');

    // Заполняем данными
    const query = `
      INSERT INTO places (
        id, category, name, description, price_min, price_max, price_unit,
        hours, address, lat, lng, discount, tips, links, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    for (const place of PLACES_DATA) {
      await client.query(query, [
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
      ]);
    }

    console.log(`✅ База данных сброшена: ${PLACES_DATA.length} мест добавлено`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка сброса БД:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

resetDatabase();
