import { json, type RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

// Unregister a Pluggy connection. Leaves already-imported transactions in place.
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	await pool.query('DELETE FROM pluggy_items WHERE id = $1', [params.id]);
	return json({ ok: true });
};
