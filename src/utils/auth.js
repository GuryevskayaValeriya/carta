const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePersonName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function createVerificationCode(length = 6) {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, '0');
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const [algorithm, salt, key] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !key) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, 64);
  const storedKeyBuffer = Buffer.from(key, 'hex');
  return (
    storedKeyBuffer.length === derivedKey.length &&
    crypto.timingSafeEqual(storedKeyBuffer, derivedKey)
  );
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = {
  createSessionToken,
  createVerificationCode,
  hashPassword,
  hashSessionToken,
  hashVerificationCode,
  normalizeEmail,
  normalizePersonName,
  verifyPassword
};
