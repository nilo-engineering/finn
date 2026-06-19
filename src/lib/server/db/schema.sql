-- Server mirror of the Dexie tables (PostgreSQL). Ids are UUID strings (text)
-- minted client- and server-side (crypto.randomUUID) so a row keeps the same id
-- locally and remotely and server-ingested rows never collide with local ones.
-- hidden/deleted are smallint 0/1 to match the client wire format;
-- updatedAt/createdAt are epoch millis (bigint). updatedAt drives last-write-wins.
-- camelCase columns are quoted so Postgres preserves their case.
--
-- "externalId" and "raw" are server-only (NOT in the /api/sync COLUMNS list):
-- "externalId" dedups rows pulled from a provider (Open Finance / Pluggy); "raw" caches
-- the provider's original transaction object for inspection. Neither is sent to or
-- written by clients.

CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  "customName" text,
  type text NOT NULL,
  "externalId" text,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

-- Idempotent: backfills the column on databases created before customName existed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "customName" text;

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  classes text NOT NULL,
  "budgetPercentage" double precision NOT NULL,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  direction text NOT NULL,
  amount double precision NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  "accountId" text NOT NULL,
  "categoryId" text,
  method text NOT NULL,
  status text NOT NULL,
  hidden smallint,
  "createdAt" bigint NOT NULL,
  "sourceRow" text,
  "externalId" text,
  "raw" jsonb,
  "counterparty" text,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

-- Idempotent: backfills the column on databases created before raw existed.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "raw" jsonb;

-- Idempotent: the other party's name (Pluggy receiver/merchant/payer). Values are
-- populated/backfilled by syncBanks, not here — a full sync repairs existing rows.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "counterparty" text;

-- Resolved CNPJ -> company name, cached from OpenCNPJ so each CNPJ is fetched once
-- across syncs/backfills. Server-only. `name` may be NULL (negative cache: looked up
-- but not found) to avoid re-querying. Stores the display name already chosen
-- (nome_fantasia when present, else razao_social).
CREATE TABLE IF NOT EXISTS cnpj_cache (
  cnpj text PRIMARY KEY,
  name text,
  "fetchedAt" bigint NOT NULL
);

-- Registered Pluggy connections (itemIds). Server-only; not synced to clients.
-- The user pastes an itemId on /banks; "Sync banks" fetches each item's accounts
-- and transactions. last_synced_at bounds the next fetch window.
CREATE TABLE IF NOT EXISTS pluggy_items (
  id text PRIMARY KEY,
  label text,
  created_at bigint NOT NULL,
  last_synced_at bigint
);

CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions ("updatedAt");

-- Dedup keys for provider-ingested rows (unique only among non-null values).
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_external_id ON accounts ("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions ("externalId");
