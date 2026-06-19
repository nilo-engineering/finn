import pg from 'pg';
import { env } from '$env/dynamic/private';
// Bundled as a string (?raw) so the schema travels inside the server build — the
// production image ships only build/, not the src/ tree the CLI migrate reads.
import schema from './db/schema.sql?raw';

// updatedAt/createdAt are bigint (epoch millis). pg returns int8 as a string by
// default; parse it to a number — ms timestamps stay well under 2^53.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

// Applied once on server boot (see hooks.server.ts). The schema is idempotent, so
// re-running on every start is safe and brings prod up to date without a separate
// deploy step. Memoized so concurrent callers share one run; a failure clears the
// memo so the next boot can retry rather than caching a rejected promise forever.
let applied: Promise<void> | undefined;
export function migrate(): Promise<void> {
	return (applied ??= pool.query(schema).then(
		() => {},
		(err) => {
			applied = undefined;
			throw err;
		}
	));
}
