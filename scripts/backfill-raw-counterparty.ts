// One-time backfill: re-fetch every registered Pluggy item's transactions from
// 2026-01-01 until now and refresh the `raw` and `counterparty` columns on the
// matching rows (joined by externalId). Bumps updatedAt so clients re-pull.
//
// Run with: npm run db:backfill-raw  (loads .env via node --env-file)
// Safe to re-run: it only UPDATEs existing rows, never inserts.
import pg from 'pg';
import { PluggyClient, type Transaction as PluggyTransaction } from 'pluggy-sdk';

const DATE_FROM = '2026-01-01';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
	process.exit(1);
}
if (!process.env.PLUGGY_CLIENT_ID || !process.env.PLUGGY_CLIENT_SECRET) {
	console.error('PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET are not set (see .env.example).');
	process.exit(1);
}

// Same priority chain as syncBanks (src/lib/server/banks.ts).
function counterparty(tx: PluggyTransaction): string | null {
	return (
		tx.paymentData?.receiver?.name ??
		tx.merchant?.businessName ??
		tx.merchant?.name ??
		tx.paymentData?.payer?.name ??
		null
	);
}

pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const pluggy = new PluggyClient({
	clientId: process.env.PLUGGY_CLIENT_ID,
	clientSecret: process.env.PLUGGY_CLIENT_SECRET
});

const { rows: items } = await pool.query<{ id: string }>('SELECT id FROM pluggy_items');
console.log(`Found ${items.length} registered Pluggy item(s).`);

let fetched = 0;
let matched = 0;
let unmatched = 0;
const now = Date.now();

for (const item of items) {
	const accounts = await pluggy.fetchAccounts(item.id);
	for (const account of accounts.results) {
		const txs = await pluggy.fetchAllTransactions(account.id, { dateFrom: DATE_FROM });
		fetched += txs.length;
		for (const tx of txs) {
			const res = await pool.query(
				'UPDATE transactions SET "raw" = $1, "counterparty" = $2, "updatedAt" = $3 WHERE "externalId" = $4',
				[JSON.stringify(tx), counterparty(tx), now, tx.id]
			);
			if (res.rowCount && res.rowCount > 0) matched++;
			else unmatched++;
		}
		console.log(`  account ${account.id}: ${txs.length} transactions fetched`);
	}
}

console.log(
	`\nDone. Fetched ${fetched} transactions: updated ${matched} existing row(s), ` +
		`${unmatched} had no matching row (not yet imported — run a normal sync to add them).`
);
await pool.end();
