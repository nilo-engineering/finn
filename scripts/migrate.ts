// Creates the server schema on the Postgres database named by DATABASE_URL.
// Run with: npm run db:migrate  (loads .env via node --env-file)
import { readFileSync } from 'node:fs';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
	process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const schema = readFileSync(new URL('../src/lib/server/db/schema.sql', import.meta.url), 'utf8');

await pool.query(schema);
console.log('Schema applied.');
await pool.end();
