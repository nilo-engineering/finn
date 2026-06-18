import { json, type RequestHandler } from '@sveltejs/kit';
import { syncBanks } from '$lib/server/banks';

// Pull the latest accounts/transactions for every registered item into Postgres.
// The client then runs its normal sync() to bring the new rows into Dexie. `mode`
// is 'fast' (delta since each item's cursor) or 'full' (re-pull year-to-date).
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.authenticated) return new Response('Unauthorized', { status: 401 });
	const { mode } = (await request.json().catch(() => ({}))) as { mode?: 'fast' | 'full' };
	const result = await syncBanks(mode === 'full' ? 'full' : 'fast');
	return json(result);
};
