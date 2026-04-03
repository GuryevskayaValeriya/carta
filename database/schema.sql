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
  links TEXT
);

ALTER TABLE places DROP COLUMN IF EXISTS verified;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  avatar_data TEXT,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;

UPDATE users
SET first_name = 'Пользователь'
WHERE first_name IS NULL OR BTRIM(first_name) = '';

ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'register',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS place_reviews (
  id BIGSERIAL PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id
  ON email_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at
  ON email_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
  ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
  ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_place_reviews_place_id_created_at
  ON place_reviews(place_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_place_reviews_user_id
  ON place_reviews(user_id);
