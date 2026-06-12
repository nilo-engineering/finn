import type { EntityTable } from 'dexie';
import { db } from '$lib/db';
import type { Account, Category, Transaction } from '$lib/db/types';

interface Changes {
	accounts: Account[];
	categories: Category[];
	transactions: Transaction[];
}

async function getCursor(key: string): Promise<number> {
	return (await db.syncMeta.get(key))?.value ?? 0;
}

async function setCursor(key: string, value: number): Promise<void> {
	await db.syncMeta.put({ key, value });
}

// Upload every local row changed since lastPushedAt; the server applies LWW.
async function push(): Promise<void> {
	const since = await getCursor('lastPushedAt');
	const [accounts, categories, transactions] = await Promise.all([
		db.accounts.where('updatedAt').above(since).toArray(),
		db.categories.where('updatedAt').above(since).toArray(),
		db.transactions.where('updatedAt').above(since).toArray()
	]);
	if (accounts.length + categories.length + transactions.length === 0) return;

	const res = await fetch('/api/sync', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ changes: { accounts, categories, transactions } })
	});
	if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
	const { serverTime } = (await res.json()) as { serverTime: number };
	await setCursor('lastPushedAt', serverTime);
}

// Download server changes since lastPulledAt and apply the winners into Dexie.
async function pull(): Promise<void> {
	const since = await getCursor('lastPulledAt');
	const res = await fetch(`/api/sync?since=${since}`);
	if (!res.ok) throw new Error(`sync pull failed: ${res.status}`);
	const { serverTime, changes } = (await res.json()) as { serverTime: number; changes: Changes };

	await db.transaction('rw', db.accounts, db.categories, db.transactions, db.syncMeta, async () => {
		await applyTable(db.accounts, changes.accounts);
		await applyTable(db.categories, changes.categories);
		await applyTable(db.transactions, changes.transactions);
		await setCursor('lastPulledAt', serverTime);
	});
}

// Write incoming rows only when they're newer than the local copy (symmetric LWW).
async function applyTable<T extends { id?: number; updatedAt: number }>(
	table: EntityTable<T, 'id'>,
	rows: T[]
): Promise<void> {
	if (!rows.length) return;
	const ids = rows.map((r) => r.id) as Parameters<typeof table.bulkGet>[0];
	const local = await table.bulkGet(ids);
	const winners = rows.filter((r, i) => {
		const current = local[i];
		return !current || r.updatedAt > current.updatedAt;
	});
	if (winners.length) await table.bulkPut(winners);
}

let inFlight = false;

// Push then pull, coalescing overlapping calls. Errors (e.g. offline) are
// swallowed so the next trigger retries.
export async function sync(): Promise<void> {
	if (inFlight) return;
	inFlight = true;
	try {
		await push();
		await pull();
	} catch (err) {
		console.warn('[sync]', err);
	} finally {
		inFlight = false;
	}
}
