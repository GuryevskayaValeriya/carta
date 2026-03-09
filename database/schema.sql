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
);
