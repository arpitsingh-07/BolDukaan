-- BolDukaan schema — M1 (persistence + public pages).
-- Apply with: npm run db:init  (reads DATABASE_URL from .env.local)
-- gen_random_uuid() is built into Postgres 13+ (Neon runs 15/16), no extension needed.
-- subscriptions table is intentionally NOT here — that's M3.

CREATE TABLE IF NOT EXISTS shops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT,                            -- set on claim in M2; NULL until then
  slug          TEXT UNIQUE NOT NULL,
  edit_token    TEXT NOT NULL,                   -- M1 login-less ownership; replaced by auth in M2
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft | active | unpublished
  category      TEXT,
  views         INTEGER NOT NULL DEFAULT 0,      -- M4: basic page-view analytics
  manually_closed BOOLEAN NOT NULL DEFAULT FALSE, -- owner override: "closed right now"
  lat           DOUBLE PRECISION,                -- shop location (optional; for "nearby")
  lng           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent adds for databases created before these columns existed.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS manually_closed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS shops_owner_user_id_idx ON shops (owner_user_id);
CREATE INDEX IF NOT EXISTS shops_slug_idx ON shops (slug);
CREATE INDEX IF NOT EXISTS shops_geo_idx ON shops (lat, lng);

CREATE TABLE IF NOT EXISTS storefronts (
  shop_id        UUID PRIMARY KEY REFERENCES shops (id) ON DELETE CASCADE,
  name           TEXT,
  tagline        TEXT,
  about          TEXT,
  phone          TEXT,
  whatsapp       TEXT,
  address        TEXT,
  hours          JSONB,
  products       JSONB,
  images         JSONB,
  theme          TEXT DEFAULT 'classic',
  language       TEXT,
  raw_transcript TEXT
);

-- Email/password accounts (alongside Google OAuth). A credential user's id
-- becomes their owner_user_id — same tenant-scoping as a Google `sub`.
-- Email is stored already-lowercased; the unique index enforces one account
-- per address case-insensitively.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

-- Consumer demand signals: when someone searches "shops near you" and finds
-- nothing, they can name the shop they want online. This is the ground team's
-- target list (which shops to go sign up, and where demand is).
CREATE TABLE IF NOT EXISTS shop_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT NOT NULL,             -- shop name or phone number the visitor entered
  lat         DOUBLE PRECISION,          -- where they were searching (optional)
  lng         DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_requests_geo_idx ON shop_requests (lat, lng);

-- Visitor reports about a shop (fake/illegal/wrong info). Feeds the Grievance
-- Officer review required by India's IT Rules.
CREATE TABLE IF NOT EXISTS shop_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_reports_slug_idx ON shop_reports (slug);

-- M3: billing. One row per owner (free by default; flips to pro on payment).
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id      TEXT NOT NULL,
  provider           TEXT NOT NULL DEFAULT 'razorpay',
  provider_sub_id    TEXT,
  plan               TEXT NOT NULL DEFAULT 'free',
  status             TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_owner_unique ON subscriptions (owner_user_id);
CREATE INDEX IF NOT EXISTS subscriptions_provider_sub_idx ON subscriptions (provider_sub_id);
