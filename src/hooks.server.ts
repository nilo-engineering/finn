import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { deLocalizeUrl, getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { SESSION_COOKIE, verifySessionCookie } from '$lib/server/auth';

// Gate the whole app behind login. /login stays open; /api/* self-guards and
// returns 401 (redirecting a fetch would be wrong). deLocalizeUrl strips any
// locale prefix so the path comparison is canonical.
const handleAuth: Handle = ({ event, resolve }) => {
	event.locals.authenticated = verifySessionCookie(event.cookies.get(SESSION_COOKIE));

	const path = deLocalizeUrl(event.url).pathname;
	if (!event.locals.authenticated && path !== '/login' && !path.startsWith('/api/')) {
		throw redirect(302, '/login');
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

export const handle: Handle = sequence(handleAuth, handleParaglide);
