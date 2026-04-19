const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/db');

const PLACES_JSON_PATH = path.join(__dirname, '../../database/places.json');

async function syncPlacesJson(clientOrPool = pool) {
  const result = await clientOrPool.query(
    `
      SELECT *
      FROM places
      ORDER BY
        CASE category
          WHEN 'food' THEN 1
          WHEN 'fun' THEN 2
          WHEN 'study' THEN 3
          WHEN 'print' THEN 4
          ELSE 5
        END,
        name ASC,
        id ASC
    `
  );

  const places = result.rows.map(serializePlaceForJson);
  const json = `${JSON.stringify(places, null, 2)}\n`;

  await fs.writeFile(PLACES_JSON_PATH, json, 'utf8');
  return places;
}

function serializePlaceForJson(row) {
  const place = {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description || '',
    price_min: Number(row.price_min) || 0,
    price_max: Number(row.price_max) || 0,
    hours: row.hours || '',
    address: row.address || '',
    lat: Number(row.lat),
    lng: Number(row.lng),
    tips: parseJsonArray(row.tips),
    links: parseJsonObject(row.links)
  };

  if (row.price_unit) {
    place.price_unit = row.price_unit;
  }

  if (row.discount) {
    place.discount = row.discount;
  }

  if (!Object.keys(place.links).length) {
    delete place.links;
  }

  return place;
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function parseJsonObject(value) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

module.exports = {
  syncPlacesJson
};
