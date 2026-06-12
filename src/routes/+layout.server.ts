import type { LayoutServerLoad } from './$types';

// Exposed so the layout only starts the sync loop once authenticated.
export const load: LayoutServerLoad = ({ locals }) => ({ authenticated: locals.authenticated });
