import { json, type RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { getPluggy } from '$lib/server/pluggy';

// Return the original provider/import data behind a transaction, for inspection in the
// UI (CTRL+click on the transactions page). `raw` and `externalId` are server-only —
// never synced to clients — so they're fetched on demand here.
//
// Stored-first, live-fallback: serve the cached `raw` when present; otherwise, for a
// provider-ingested row (has an externalId but predates the `raw` column), fetch it live
// from Pluggy and cache it back. CSV imports have no externalId — they fall through and
// the client renders their `sourceRow` instead.
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });

	const { rows } = await pool.query<{
		externalId: string | null;
		raw: unknown;
		sourceRow: string | null;
	}>('SELECT "externalId", raw, "sourceRow" FROM transactions WHERE id = $1', [params.id]);
	const row = rows[0];
	if (!row) return new Response('Not found', { status: 404 });

	let raw = row.raw; // jsonb → already parsed by pg
	if (!raw && row.externalId) {
		try {
			raw = await getPluggy().fetchTransaction(row.externalId);
			// Cache it back so the next view is instant. No `updatedAt` bump: `raw` is
			// server-only and never participates in last-write-wins sync.
			await pool.query('UPDATE transactions SET raw = $1 WHERE id = $2', [
				JSON.stringify(raw),
				params.id
			]);
		} catch (err) {
			// Item disconnected / rate-limited / not found upstream: degrade gracefully so
			// the modal can show the message instead of failing the request.
			return json({
				externalId: row.externalId,
				raw: null,
				sourceRow: row.sourceRow,
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	return json({ externalId: row.externalId, raw, sourceRow: row.sourceRow });
};
