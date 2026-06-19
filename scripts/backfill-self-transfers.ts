// One-time backfill: transactions whose payer AND receiver both carry the owner's
// document are self-transfers (money between the owner's own accounts). Set their
// counterparty to OWNER_NAME and hide them from the dashboard. Bumps updatedAt so
// clients re-pull. Safe to re-run (the WHERE guard skips already-correct rows).
//
// Run with: node --env-file=.env --experimental-strip-types scripts/backfill-self-transfers.ts
import pg from 'pg';

const OWNER_DOCUMENT = (process.env.OWNER_DOCUMENT ?? '').replace(/\D/g, '');
const OWNER_NAME = process.env.OWNER_NAME ?? '';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
	process.exit(1);
}
if (!OWNER_DOCUMENT || !OWNER_NAME) {
	console.error('OWNER_DOCUMENT / OWNER_NAME are not set (see .env.example).');
	process.exit(1);
}

pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const now = Date.now();

// Match on digits-only of the payer/receiver document values stored in raw.paymentData.
const WHERE_SELF = `
	regexp_replace(coalesce("raw"->'paymentData'->'payer'->'documentNumber'->>'value', ''), '\\D', '', 'g') = $1
	AND regexp_replace(coalesce("raw"->'paymentData'->'receiver'->'documentNumber'->>'value', ''), '\\D', '', 'g') = $1`;

const before = await pool.query(
	`SELECT description, count(*) FROM transactions WHERE ${WHERE_SELF} GROUP BY 1 ORDER BY 2 DESC`,
	[OWNER_DOCUMENT]
);
console.log('Self-transfers found (by description):');
console.table(before.rows);

const res = await pool.query(
	`UPDATE transactions SET "counterparty" = $2, hidden = 1, "updatedAt" = $3
	 WHERE ${WHERE_SELF}
	   AND ("counterparty" IS DISTINCT FROM $2 OR hidden IS DISTINCT FROM 1)`,
	[OWNER_DOCUMENT, OWNER_NAME, now]
);
console.log(`\nUpdated ${res.rowCount} self-transfer row(s): counterparty="${OWNER_NAME}", hidden=1.`);
await pool.end();
