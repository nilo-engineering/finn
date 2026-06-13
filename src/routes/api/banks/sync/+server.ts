import { json, type RequestHandler } from '@sveltejs/kit';
import { syncBanks } from '$lib/server/banks';

// Pull the latest accounts/transactions for every registered item into Postgres.
// The client then runs its normal sync() to bring the new rows into Dexie.
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const result = await syncBanks();
	return json(result);
};
