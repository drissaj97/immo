-- DarBladi — migration initiale
-- Extensions requises : postgis, vector (optionnel phase 3)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('visitor','buyer','investor','agent','agency_admin','developer','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('apartment','villa','riad','land','commercial','office');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('sale','long_term_rent','seasonal_rent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft','pending_review','published','archived','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE currency AS ENUM ('MAD','EUR','USD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables créées via Drizzle db:push ou drizzle-kit migrate
-- Voir src/lib/db/schema.ts pour le schéma source de vérité
