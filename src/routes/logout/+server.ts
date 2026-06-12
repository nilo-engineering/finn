import type { RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth';

// Clears the session cookie. The client navigates to /login itself, so this is
// a plain 204 (no redirect) — called via fetch, like the sync endpoint, which
// keeps it off the CSRF-checked form-POST path.
export const POST: RequestHandler = ({ cookies }) => {
	clearSessionCookie(cookies);
	return new Response(null, { status: 204 });
};
