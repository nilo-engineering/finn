import type { PoolClient } from 'pg';
import type { Account as PluggyAccount, Transaction as PluggyTransaction } from 'pluggy-sdk';
import { pool } from './db';
import { getPluggy } from './pluggy';

// 'fast' pulls only the delta since each item's last sync cursor; 'full' re-pulls
// the whole year-to-date. Dedup is by externalId, so 'full' only costs extra
// fetching, never duplicate rows.
export type SyncMode = 'fast' | 'full';

function isoDate(epochMs: number): string {
	return new Date(epochMs).toISOString().slice(0, 10);
}

// Jan 1 of the current year — the floor for a full sync, and the fallback for a
// fast sync of an item that has never been synced.
function startOfCurrentYear(): string {
	return `${new Date().getUTCFullYear()}-01-01`;
}

// Pluggy `amount` sign meaning flips by account type: for BANK accounts a positive
// amount is money in; for CREDIT cards a positive amount is a new charge (money
// out) and a negative is a payment/refund (money in). Normalise to our model.
function mapMovement(account: PluggyAccount, tx: PluggyTransaction) {
	const isCredit = account.type === 'CREDIT';
	const inflow = isCredit ? tx.amount < 0 : tx.amount > 0;
	const direction = inflow ? 'in' : 'out';
	const method = isCredit ? 'Credit' : inflow ? 'Deposit' : 'Debit';
	return { direction, amount: Math.abs(tx.amount), method } as const;
}

// A descriptive, unique account name: institution label plus a distinguishing
// suffix. The Dexie mirror enforces unique names — a collision would make the
// whole client pull abort — so always append the masked number's last digits, or
// a slice of the (globally unique) externalId when no number is available.
function accountName(account: PluggyAccount): string {
	const base = account.marketingName ?? account.name;
	const numberTail = account.number ? account.number.replace(/\D/g, '').slice(-4) : '';
	return `${base} ·${numberTail || account.id.slice(0, 8)}`;
}

// Upsert a Pluggy account into our accounts table, matched by externalId. Returns
// the local (UUID) account id and whether it was newly created.
async function upsertAccount(
	client: PoolClient,
	account: PluggyAccount,
	now: number
): Promise<{ id: string; created: boolean }> {
	const existing = await client.query<{ id: string }>(
		'SELECT id FROM accounts WHERE "externalId" = $1',
		[account.id]
	);
	if (existing.rows[0]) {
		await client.query('UPDATE accounts SET name = $1, "updatedAt" = $2 WHERE id = $3', [
			accountName(account),
			now,
			existing.rows[0].id
		]);
		return { id: existing.rows[0].id, created: false };
	}
	const id = crypto.randomUUID();
	await client.query(
		'INSERT INTO accounts (id, name, type, "externalId", "updatedAt", deleted) VALUES ($1, $2, $3, $4, $5, 0)',
		[id, accountName(account), 'bank', account.id, now]
	);
	return { id, created: true };
}

// Insert one Pluggy transaction if its externalId is new. Returns true when a row
// was inserted (false = already imported). Lands as `pending` so it flows through
// the existing review/categorisation UI, like a CSV import.
async function insertTransaction(
	client: PoolClient,
	tx: PluggyTransaction,
	account: PluggyAccount,
	localAccountId: string,
	now: number
): Promise<boolean> {
	const seen = await client.query('SELECT 1 FROM transactions WHERE "externalId" = $1', [tx.id]);
	if (seen.rows[0]) return false;

	const { direction, amount, method } = mapMovement(account, tx);
	const when = new Date(tx.date);
	const date = when.toISOString().slice(0, 10);
	const time = when.toISOString().slice(11, 16);
	const title = tx.merchant?.name ?? tx.description;
	const description = tx.descriptionRaw ?? tx.description;

	await client.query(
		`INSERT INTO transactions
		 (id, direction, amount, title, description, date, time, "accountId", "categoryId",
		  method, status, hidden, "createdAt", "sourceRow", "externalId", "raw", "updatedAt", deleted)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,$9,'pending',NULL,$10,NULL,$11,$12,$13,0)`,
		[
			crypto.randomUUID(),
			direction,
			amount,
			title,
			description,
			date,
			time,
			localAccountId,
			method,
			now,
			tx.id,
			JSON.stringify(tx),
			now
		]
	);
	return true;
}

type FetchedAccount = { account: PluggyAccount; txs: PluggyTransaction[] };

// Fetch every registered item's accounts and transactions, then upsert them.
//
// The slow Pluggy network I/O (Phase 2) is deliberately kept OUT of the DB write
// transaction (Phase 3): `updatedAt` is stamped right before COMMIT so the window
// between stamping and commit is milliseconds. Otherwise a concurrent client pull
// (the 45s loop / tab focus / reconnect) firing mid-sync would advance its
// `lastPulledAt` cursor past rows still being fetched, hiding them from every
// future delta pull. Dedup is by externalId, so re-running is safe. Returns counts.
export async function syncBanks(
	mode: SyncMode = 'fast'
): Promise<{ accountsAdded: number; transactionsAdded: number }> {
	const pluggy = getPluggy();

	// Phase 1: which items to sync (quick read).
	const { rows: items } = await pool.query<{ id: string; last_synced_at: number | null }>(
		'SELECT id, last_synced_at FROM pluggy_items'
	);

	// Phase 2: all network I/O, collected into memory — no DB writes here.
	const fetched: FetchedAccount[] = [];
	for (const item of items) {
		// Full sync (or a never-synced item) re-pulls from the year start; fast sync
		// pulls only the delta since this item's cursor.
		const dateFrom =
			mode === 'full' || item.last_synced_at === null
				? startOfCurrentYear()
				: isoDate(item.last_synced_at);
		const accounts = await pluggy.fetchAccounts(item.id);
		for (const account of accounts.results) {
			const txs = await pluggy.fetchAllTransactions(account.id, { dateFrom });
			fetched.push({ account, txs });
		}
	}

	// Phase 3: short write transaction with `updatedAt` stamped at ~commit time.
	const client = await pool.connect();
	let accountsAdded = 0;
	let transactionsAdded = 0;
	try {
		await client.query('BEGIN');
		const now = Date.now();
		for (const { account, txs } of fetched) {
			const { id: localAccountId, created } = await upsertAccount(client, account, now);
			if (created) accountsAdded++;
			for (const tx of txs) {
				if (await insertTransaction(client, tx, account, localAccountId, now)) transactionsAdded++;
			}
		}
		for (const item of items) {
			await client.query('UPDATE pluggy_items SET last_synced_at = $1 WHERE id = $2', [
				now,
				item.id
			]);
		}
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
	return { accountsAdded, transactionsAdded };
}
