require('dotenv').config({ path: '../.env' }); // Adjust path if running from database folder, but we will run from root usually. Let's try to be robust.
// Actually better to assume we run from root as `node database/init.js`
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DATA_PATH = path.join(__dirname, 'places.json');

async function initDatabase() {
  const args = process.argv.slice(2);
  const isReset = args.includes('--reset');

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Подключение к БД установлено');

    if (isReset) {
      console.log('⚠️  Режим сброса: удаление таблицы places...');
      await client.query('DROP TABLE IF EXISTS places CASCADE');
      console.log('🗑️  Таблица places удалена');
    }

    // Чтение и выполнение схемы
    console.log('📄 Применение схемы БД...');
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Схема применена');

    // Проверка, пустая ли таблица (если не сброс)
    if (!isReset) {
      const res = await client.query('SELECT COUNT(*) FROM places');
      const count = parseInt(res.rows[0].count, 10);
      if (count > 0) {
        console.log(`ℹ️  В таблице уже есть ${count} записей. Пропуск заполнения.`);
        console.log('💡 Используйте --reset для полной перезаписи.');
        return;
      }
    }

    // Заполнение данными
    console.log('🌱 Заполнение начальными данными...');
    const placesData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    
    const insertQuery = `
      INSERT INTO places (
        id, category, name, description, price_min, price_max, price_unit,
        hours, address, lat, lng, discount, tips, links, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_min = EXCLUDED.price_min,
        price_max = EXCLUDED.price_max,
        price_unit = EXCLUDED.price_unit,
        hours = EXCLUDED.hours,
        address = EXCLUDED.address,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        discount = EXCLUDED.discount,
        tips = EXCLUDED.tips,
        links = EXCLUDED.links,
        verified = EXCLUDED.verified;
    `;
    // Added ON CONFLICT just in case, though if not reset, we skip. But if we want to update existing...
    // Actually, for "init" without reset, we usually just skip if exists.
    // But let's stick to the logic: if reset -> drop & create. if not reset -> create if not exists, then check count.

    let insertedCount = 0;
    for (const place of placesData) {
      // Подготовка данных (stringify для JSON-полей)
      const tips = typeof place.tips === 'string' ? place.tips : JSON.stringify(place.tips || []);
      const links = typeof place.links === 'string' ? place.links : JSON.stringify(place.links || {});
      
      await client.query(insertQuery, [
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
        tips,
        links,
        place.verified
      ]);
      insertedCount++;
    }

    console.log(`✅ Успешно загружено ${insertedCount} мест.`);

  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initDatabase();
