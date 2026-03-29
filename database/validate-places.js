const VALID_CATEGORIES = new Set(['food', 'fun', 'study', 'print']);

function validatePlacesData(places) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();
  const seenMapLinks = new Map();

  if (!Array.isArray(places)) {
    return {
      errors: ['Places data must be an array.'],
      warnings
    };
  }

  places.forEach((place, index) => {
    const entryLabel = `place #${index + 1}`;

    if (!place || typeof place !== 'object') {
      errors.push(`${entryLabel}: entry must be an object.`);
      return;
    }

    const id = String(place.id || '').trim();
    const category = String(place.category || '').trim();
    const name = String(place.name || '').trim();
    const hours = String(place.hours || '').trim();
    const address = String(place.address || '').trim();
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    const priceMin = Number(place.price_min);
    const priceMax = Number(place.price_max);

    if (!id) {
      errors.push(`${entryLabel}: id is required.`);
    } else if (seenIds.has(id)) {
      errors.push(`${entryLabel}: duplicate id "${id}" also used at entry #${seenIds.get(id)}.`);
    } else {
      seenIds.set(id, index + 1);
    }

    if (!VALID_CATEGORIES.has(category)) {
      errors.push(`${entryLabel}: category "${category}" is invalid.`);
    }

    if (!name) {
      errors.push(`${entryLabel}: name is required.`);
    }

    if (!hours) {
      errors.push(`${entryLabel}: hours are required.`);
    }

    if (!address) {
      errors.push(`${entryLabel}: address is required.`);
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.push(`${entryLabel}: lat must be a valid latitude.`);
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.push(`${entryLabel}: lng must be a valid longitude.`);
    }

    if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax)) {
      errors.push(`${entryLabel}: price_min and price_max must be numbers.`);
    } else if (priceMin > priceMax) {
      errors.push(`${entryLabel}: price_min cannot be greater than price_max.`);
    }

    if (place.links && typeof place.links !== 'object') {
      errors.push(`${entryLabel}: links must be an object when provided.`);
    }

    if (place.links?.map) {
      const mapLink = String(place.links.map).trim();

      try {
        const parsed = new URL(mapLink);
        if (!parsed.protocol.startsWith('http')) {
          errors.push(`${entryLabel}: links.map must use http/https.`);
        }
      } catch (error) {
        errors.push(`${entryLabel}: links.map is not a valid URL.`);
      }

      if (seenMapLinks.has(mapLink)) {
        warnings.push(
          `${entryLabel}: links.map duplicates entry #${seenMapLinks.get(mapLink)} (${mapLink}).`
        );
      } else {
        seenMapLinks.set(mapLink, index + 1);
      }
    }

    if (place.tips && !Array.isArray(place.tips)) {
      errors.push(`${entryLabel}: tips must be an array when provided.`);
    }
  });

  return { errors, warnings };
}

function printValidationReport({ errors, warnings }) {
  warnings.forEach((warning) => {
    console.warn(`[places:warn] ${warning}`);
  });

  errors.forEach((error) => {
    console.error(`[places:error] ${error}`);
  });
}

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const dataPath = path.join(__dirname, 'places.json');
  const places = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const result = validatePlacesData(places);

  printValidationReport(result);

  if (result.errors.length > 0) {
    process.exit(1);
  }

  console.log(`[places:ok] validated ${places.length} places`);
}

module.exports = {
  validatePlacesData
};
