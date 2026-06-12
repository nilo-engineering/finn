import pg from 'pg';
import { env } from '$env/dynamic/private';

// updatedAt/createdAt are bigint (epoch millis). pg returns int8 as a string by
// default; parse it to a number — ms timestamps stay well under 2^53.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
