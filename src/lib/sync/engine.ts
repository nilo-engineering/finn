import type { EntityTable } from 'dexie';
import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Account, Category, Transaction } from '$lib/db/types';

interface Changes {
	accounts: Account[];
	categories: Category[];
	transactions: Transaction[];
}

// A 401 means the session expired; bounce to login. Otherwise surface the error
// so sync() logs it and retries on the next trigger.
function assertOk(res: Response, label: string): void {
	if (res.status === 401) {
		if (browser) window.location.href = '/login';
		throw new Error('sync unauthorized');
	}
	if (!res.ok) throw new Error(`sync ${label} failed: ${res.status}`);
}

async function getCursor(key: string): Promise<number> {
	return (await db.syncMeta.get(key))?.value ?? 0;
}

async function setCursor(key: string, value: number): Promise<void> {
	await db.syncMeta.put({ key, value });
}

// One-time repair: older builds advanced lastPushedAt to the server's clock, which
// under server clock skew could park the cursor ahead of local edits and strand them
// unpushed (a stuck categorization never reaching the backend). Reset the push cursor
// once so every local row re-uploads; the server's last-write-wins upsert makes the
// re-push idempotent for rows it already has.
export async function migratePushCursor(): Promise<void> {
	if (await getCursor('pushCursorResetV1')) return;
	await setCursor('lastPushedAt', 0);
	await setCursor('pushCursorResetV1', 1);
}

// Max rows per push request. Keeps the JSON body well under the adapter's default
// BODY_SIZE_LIMIT (512 KB) so a large delta — a full re-sync or a big CSV import —
// doesn't get rejected. ~414 B/row, so 500 rows ≈ 0.2 MB.
const PUSH_CHUNK = 500;

// Split the delta into batches of at most PUSH_CHUNK rows total, packed in
// parents-before-children order (accounts, categories, then transactions).
function chunkChanges(accounts: Account[], categories: Category[], transactions: Transaction[]) {
	const batches: Changes[] = [];
	let a = 0;
	let c = 0;
	let t = 0;
	while (a < accounts.length || c < categories.length || t < transactions.length) {
		let budget = PUSH_CHUNK;
		const accs = accounts.slice(a, a + budget);
		a += accs.length;
		budget -= accs.length;
		const cats = categories.slice(c, c + budget);
		c += cats.length;
		budget -= cats.length;
		const txs = transactions.slice(t, t + budget);
		t += txs.length;
		batches.push({ accounts: accs, categories: cats, transactions: txs });
	}
	return batches;
}

// Upload every local row changed since lastPushedAt; the server applies LWW.
async function push(): Promise<void> {
	const since = await getCursor('lastPushedAt');
	const [accounts, categories, transactions] = await Promise.all([
		db.accounts.where('updatedAt').above(since).toArray(),
		db.categories.where('updatedAt').above(since).toArray(),
		db.transactions.where('updatedAt').above(since).toArray()
	]);
	const rows = [...accounts, ...categories, ...transactions];
	if (rows.length === 0) return;

	// Send in bounded batches, but only advance the cursor once every batch lands.
	// Each request is its own server transaction, so re-sending earlier batches after
	// a mid-way failure is an idempotent LWW no-op. Advancing per-batch would be unsafe:
	// rows sharing an updatedAt (e.g. a bulk import) could straddle a batch boundary and
	// the strict `.above(cursor)` filter would strand the ones left behind.
	for (const changes of chunkChanges(accounts, categories, transactions)) {
		const res = await fetch('/api/sync', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ changes })
		});
		assertOk(res, 'push');
	}
	// Advance the cursor in the same clock as `updatedAt` (the client's), not the
	// server's serverTime — otherwise server clock skew can park the cursor ahead of
	// later local edits and they'd never be pushed.
	const highWater = rows.reduce((max, r) => Math.max(max, r.updatedAt), since);
	await setCursor('lastPushedAt', highWater);
}

// Download server changes since lastPulledAt and apply the winners into Dexie.
async function pull(): Promise<void> {
	const since = await getCursor('lastPulledAt');
	const res = await fetch(`/api/sync?since=${since}`);
	assertOk(res, 'pull');
	const { serverTime, changes } = (await res.json()) as { serverTime: number; changes: Changes };

	await db.transaction('rw', db.accounts, db.categories, db.transactions, db.syncMeta, async () => {
		await applyTable(db.accounts, changes.accounts);
		await applyTable(db.categories, changes.categories);
		await applyTable(db.transactions, changes.transactions);
		await setCursor('lastPulledAt', serverTime);
	});
}

// Write incoming rows only when they're newer than the local copy (symmetric LWW).
async function applyTable<T extends { id?: string; updatedAt: number }>(
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

// Force a full reconciliation: reset the pull cursor so the next pull re-fetches
// every server row (since=0), not just the delta since the last cursor. Needed
// after a bank sync — the server ingests rows whose `updatedAt` can sit behind the
// client's cursor, and transactions are dedup'd by externalId so a delta pull
// would never re-send them. A full pull is idempotent (applyTable is last-write-wins).
export async function fullSync(): Promise<void> {
	await setCursor('lastPulledAt', 0);
	await sync();
}
