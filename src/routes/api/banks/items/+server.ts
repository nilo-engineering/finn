import { json, type RequestHandler } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { getPluggy } from '$lib/server/pluggy';

// List the registered Pluggy connections for the /banks page.
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const { rows } = await pool.query(
		'SELECT id, label, last_synced_at FROM pluggy_items ORDER BY created_at'
	);
	return json({ items: rows });
};

// Register an itemId (obtained from the Pluggy/MeuPluggy dashboard). We validate it
// by fetching the item, which also gives us the connector name for the label.
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const { itemId } = (await request.json()) as { itemId?: string };
	if (!itemId) return new Response('itemId is required', { status: 400 });

	let label: string;
	try {
		const item = await getPluggy().fetchItem(itemId);
		label = item.connector.name;
	} catch {
		return new Response('Could not fetch this item — check the itemId and credentials', {
			status: 400
		});
	}

	await pool.query(
		`INSERT INTO pluggy_items (id, label, created_at) VALUES ($1, $2, $3)
		 ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
		[itemId, label, Date.now()]
	);
	return json({ item: { id: itemId, label, last_synced_at: null } });
};
