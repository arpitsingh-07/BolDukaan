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
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent add for databases created before M4.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS shops_owner_user_id_idx ON shops (owner_user_id);
CREATE INDEX IF NOT EXISTS shops_slug_idx ON shops (slug);

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
