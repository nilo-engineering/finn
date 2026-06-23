import { json, type RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

type Table = 'accounts' | 'categories' | 'transactions';

// Column order per table. `id` first so the upsert builder can skip it in the
// UPDATE clause. Parents (accounts, categories) come before transactions so FK
// targets exist when transactions are applied.
const COLUMNS: Record<Table, string[]> = {
	accounts: ['id', 'name', 'customName', 'type', 'hidden', 'updatedAt', 'deleted'],
	categories: ['id', 'name', 'classes', 'budgetPercentage', 'updatedAt', 'deleted'],
	transactions: [
		'id',
		'direction',
		'amount',
		'title',
		'description',
		'date',
		'time',
		'accountId',
		'categoryId',
		'method',
		'counterparty',
		'status',
		'hidden',
		'createdAt',
		'sourceRow',
		'updatedAt',
		'deleted'
	]
};

const TABLES = Object.keys(COLUMNS) as Table[];

// camelCase columns must be quoted so Postgres preserves their case.
function q(identifier: string): string {
	return `"${identifier}"`;
}

// Pull: every row changed since the client's cursor, tombstones included.
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const since = Number(url.searchParams.get('since') ?? 0);
	const serverTime = Date.now();
	const changes: Record<Table, Record<string, unknown>[]> = {
		accounts: [],
		categories: [],
		transactions: []
	};
	for (const table of TABLES) {
		const { rows } = await pool.query(`SELECT * FROM ${table} WHERE "updatedAt" > $1`, [since]);
		changes[table] = rows.map((row) => toClientRow(table, row));
	}
	return json({ serverTime, changes });
};

// Push: upsert the client's local delta with last-write-wins by updatedAt,
// inside a single transaction.
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const body = (await request.json()) as { changes?: Partial<Record<Table, unknown[]>> };
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		for (const table of TABLES) {
			const rows = (body.changes?.[table] ?? []) as Record<string, unknown>[];
			// Upsert in multi-row batches: one round-trip per chunk instead of per row,
			// so a large push (full re-sync, CSV import) doesn't fan out into hundreds
			// of sequential queries against a remote DB. Chunk size keeps each statement
			// under Postgres's 65535 bound-parameter limit.
			const perChunk = Math.max(1, Math.floor(65535 / COLUMNS[table].length));
			for (let i = 0; i < rows.length; i += perChunk) {
				const { text, values } = buildUpsert(table, rows.slice(i, i + perChunk));
				await client.query(text, values);
			}
		}
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
	return json({ serverTime: Date.now() });
};

function buildUpsert(
	table: Table,
	rows: Record<string, unknown>[]
): { text: string; values: unknown[] } {
	const cols = COLUMNS[table];
	const colList = cols.map(q).join(', ');
	const values: unknown[] = [];
	const tuples = rows.map((row, r) => {
		const placeholders = cols.map((col, c) => {
			values.push(toDbValue(col, row[col]));
			return `$${r * cols.length + c + 1}`;
		});
		return `(${placeholders.join(', ')})`;
	});
	const updates = cols
		.filter((c) => c !== 'id')
		.map((c) => `${q(c)} = EXCLUDED.${q(c)}`)
		.join(', ');
	const text =
		`INSERT INTO ${table} (${colList}) VALUES ${tuples.join(', ')} ` +
		`ON CONFLICT (id) DO UPDATE SET ${updates} ` +
		`WHERE EXCLUDED."updatedAt" > ${table}."updatedAt"`;
	return { text, values };
}

// hidden/deleted are stored smallint 0/1; missing optionals -> NULL.
function toDbValue(col: string, value: unknown): unknown {
	if (col === 'hidden' || col === 'deleted') return value ? 1 : 0;
	if (value === undefined || value === null) return null;
	return value;
}

// Map a server row back to the client/Dexie shape (0/1 -> boolean for hidden).
function toClientRow(table: Table, row: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const col of COLUMNS[table]) out[col] = row[col];
	if (COLUMNS[table].includes('hidden')) out.hidden = Boolean(row.hidden);
	return out;
}
