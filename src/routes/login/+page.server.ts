import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { setSessionCookie, verifyPassword } from '$lib/server/auth';

export const load: ServerLoad = ({ locals }) => {
	if (locals.authenticated) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (!verifyPassword(password)) {
			return fail(401, { error: 'Wrong password' });
		}

		setSessionCookie(cookies);
		throw redirect(303, '/');
	}
};
