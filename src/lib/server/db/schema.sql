-- Server mirror of the Dexie tables (PostgreSQL). The client owns the integer
-- ids (no SERIAL) so a row keeps the same id locally and remotely. hidden/deleted
-- are smallint 0/1 to match the client wire format; updatedAt/createdAt are epoch
-- millis (bigint). updatedAt drives last-write-wins. camelCase columns are quoted
-- so Postgres preserves their case.

CREATE TABLE IF NOT EXISTS accounts (
  id integer PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id integer PRIMARY KEY,
  name text NOT NULL,
  classes text NOT NULL,
  "budgetPercentage" double precision NOT NULL,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id integer PRIMARY KEY,
  direction text NOT NULL,
  amount double precision NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  "accountId" integer NOT NULL,
  "categoryId" integer,
  method text NOT NULL,
  status text NOT NULL,
  hidden smallint,
  "createdAt" bigint NOT NULL,
  "sourceRow" text,
  "updatedAt" bigint NOT NULL,
  deleted smallint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions ("updatedAt");
