import { PluggyClient } from 'pluggy-sdk';
import { env } from '$env/dynamic/private';

// Lazily built so the missing-credentials error (PluggyClient throws on empty
// keys) only surfaces when the "Sync banks" feature is actually used — not at
// import time, which would break the build's route analysis. Credentials come
// from the dashboard (see .env.example), read via $env/dynamic/private.
let client: PluggyClient | undefined;

export function getPluggy(): PluggyClient {
	client ??= new PluggyClient({
		clientId: env.PLUGGY_CLIENT_ID ?? '',
		clientSecret: env.PLUGGY_CLIENT_SECRET ?? ''
	});
	return client;
}
