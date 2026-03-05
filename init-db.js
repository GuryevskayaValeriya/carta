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
    verified: true
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
    verified: true
  },
  {
    id: 'food-3',
    category: 'food',
    name: 'Кафе «Книги и Кофе»',
    description: 'Уютное кафе рядом с библиотекой им. Лермонтова',
    price_min: 120,
    price_max: 250,
    hours: '9:00–21:00',
    address: 'ул. Республики, 60',
    lat: 57.150500,
    lng: 65.544865,
    tips: JSON.stringify([
      'Скидка 15% по студаку до 16:00',
      'Бесплатный Wi-Fi и розетки у окон',
      'Можно сидеть час без чувства вины'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/chain/knigi_i_kofe/236773987201/?ll=65.568900%2C57.151200&z=17'
    }),
    verified: true
  },
  {
    id: 'food-4',
    category: 'food',
    name: 'Теремок',
    description: 'Быстро и сытно — идеально между парами',
    price_min: 130,
    price_max: 220,
    hours: '8:00–22:00',
    address: 'ул. Ленина, 38',
    lat: 57.155030,
    lng: 65.532082,
    tips: JSON.stringify([
      'Блинчики с мясом 159₽ — хватит на 2 пары',
      'Можно заказать навынос через приложение',
      'Студенческая скидка 10% по средам'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/org/teremok/1657452843/?ll=65.564500%2C57.148900&z=17'
    }),
    verified: true
  },
  {
    id: 'food-5',
    category: 'food',
    name: 'Ларёк «Шаурма у универа»',
    description: 'Быстро, дёшево, без очередей',
    price_min: 90,
    price_max: 150,
    hours: '9:00–21:00',
    address: 'ул. Семакова, 8 (у входа в ТюмГУ)',
    lat: 57.159658,
    lng: 65.531750,
    tips: JSON.stringify([
      'Шаурма 120₽ — готовят на месте',
      'Кофе 50₽, хот-дог 70₽',
      'Можно оплатить картой'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.567000%2C57.145400&z=17'
    }),
    verified: true
  },
  {
    id: 'food-6',
    category: 'food',
    name: 'Пятёрочка',
    description: 'Супермаркет с горячей линией и готовой едой',
    price_min: 70,
    price_max: 180,
    hours: 'Круглосуточно',
    address: 'ул. Семакова, 15',
    lat: 57.158438,
    lng: 65.530591,
    tips: JSON.stringify([
      'Пельмени 120₽ за упаковку (хватит на 2 раза)',
      'Горячая линия: курица гриль 149₽',
      'Скидки по карте Пятёрочки'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/org/pyatyorochka/1588693477/?ll=65.568000%2C57.145900&z=17'
    }),
    verified: true
  },
  {
    id: 'fun-1',
    category: 'fun',
    name: 'Парк «Гагарина»',
    description: 'Большой парк с лавочками, фонтанами и бесплатными мероприятиями',
    price_min: 0,
    price_max: 0,
    hours: 'Круглосуточно',
    address: 'ул. Гагарина',
    lat: 57.172437,
    lng: 65.621755,
    tips: JSON.stringify([
      'Летом — бесплатные концерты по выходным',
      'Много скамеек в тени для учёбы',
      'Рядом фонтан — красиво вечером'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/park/park_gagarina/207330381/?ll=65.550000%2C57.153000&z=15'
    }),
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
  },
  {
    id: 'print-1',
    category: 'print',
    name: 'Типография «Печать+»',
    description: 'Печать курсовых, дипломов, плакатов со скидкой',
    price_min: 5,
    price_max: 500,
    hours: '9:00–19:00',
    address: 'ул. Республики, 45',
    lat: 57.153961,
    lng: 65.539143,
    discount: '15% по студаку',
    tips: JSON.stringify([
      'Курсовая 50 страниц = 350₽ со скидкой',
      'Диплом в твёрдом переплёте — 1200₽',
      'Срочный заказ (+50%) готов за 2 часа'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.568500%2C57.150500&z=17'
    }),
    verified: true
  },
  {
    id: 'print-2',
    category: 'print',
    name: 'Почта России',
    description: 'Распечатка, сканирование, копирование',
    price_min: 5,
    price_max: 200,
    hours: '9:00–20:00',
    address: 'ул. Ленина, 25',
    lat: 57.158164,
    lng: 65.527249,
    tips: JSON.stringify([
      'Можно оплатить картой',
      'Скан документов — 10₽ за страницу',
      'Менее загружена после 17:00'
    ]),
    links: JSON.stringify({
      map: 'https://yandex.ru/maps/59/tiumen/org/pochta_rossii/1075840733/?ll=65.563000%2C57.148000&z=17'
    }),
    verified: true
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
    verified: true
  },
];

async function initDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Подключение к базе данных установлено');

    // Создаём таблицу places
    await client.query(`
      CREATE TABLE IF NOT EXISTS places (
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
    console.log('✅ Таблица places создана/проверена');

    // Проверяем, есть ли данные в таблице
    const countResult = await client.query('SELECT COUNT(*) FROM places');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      // Таблица пустая — заполняем данными
      const query = `
        INSERT INTO places (
          id, category, name, description, price_min, price_max, price_unit,
          hours, address, lat, lng, discount, tips, links, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
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

      console.log(`✅ База данных инициализирована: ${PLACES_DATA.length} мест добавлено`);
    } else {
      console.log(`✅ База данных подключена: ${count} мест в таблице`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка инициализации БД:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initDatabase();
