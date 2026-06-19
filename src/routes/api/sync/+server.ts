import { json, type RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

type Table = 'accounts' | 'categories' | 'transactions';

// Column order per table. `id` first so the upsert builder can skip it in the
// UPDATE clause. Parents (accounts, categories) come before transactions so FK
// targets exist when transactions are applied.
const COLUMNS: Record<Table, string[]> = {
	accounts: ['id', 'name', 'customName', 'type', 'updatedAt', 'deleted'],
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
			for (const row of body.changes?.[table] ?? []) {
				const { text, values } = buildUpsert(table, row as Record<string, unknown>);
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
	row: Record<string, unknown>
): { text: string; values: unknown[] } {
	const cols = COLUMNS[table];
	const colList = cols.map(q).join(', ');
	const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
	const updates = cols
		.filter((c) => c !== 'id')
		.map((c) => `${q(c)} = EXCLUDED.${q(c)}`)
		.join(', ');
	const text =
		`INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ` +
		`ON CONFLICT (id) DO UPDATE SET ${updates} ` +
		`WHERE EXCLUDED."updatedAt" > ${table}."updatedAt"`;
	const values = cols.map((c) => toDbValue(c, row[c]));
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
	if (table === 'transactions') out.hidden = Boolean(row.hidden);
	return out;
}
