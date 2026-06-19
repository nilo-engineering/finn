// One-time backfill: for transactions whose payer or receiver document is a CNPJ, set
// the counterparty to the OpenCNPJ company name (nome_fantasia, else razao_social).
// CNPJ -> name results are cached in cnpj_cache so each CNPJ is fetched once. Bumps
// updatedAt so clients re-pull. Safe to re-run (only writes when the name changes).
//
// Run with: node --env-file=.env --experimental-strip-types scripts/backfill-cnpj-names.ts
import pg from 'pg';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
	process.exit(1);
}

pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`CREATE TABLE IF NOT EXISTS cnpj_cache (
  cnpj text PRIMARY KEY, name text, "fetchedAt" bigint NOT NULL)`);

// Same resolver as src/lib/server/cnpj.ts, inlined so this script stays standalone.
async function resolveCnpjName(rawCnpj: string): Promise<string | null> {
	const cnpj = rawCnpj.replace(/\D/g, '');
	if (cnpj.length !== 14) return null;
	const cached = await pool.query<{ name: string | null }>(
		'SELECT name FROM cnpj_cache WHERE cnpj = $1',
		[cnpj]
	);
	if (cached.rows[0]) return cached.rows[0].name;
	let name: string | null;
	try {
		const res = await fetch(`https://api.opencnpj.org/${cnpj}`);
		if (res.ok) {
			const data = (await res.json()) as { razao_social?: string; nome_fantasia?: string };
			name = data.nome_fantasia?.trim() || data.razao_social?.trim() || null;
		} else if (res.status === 404) {
			name = null;
		} else {
			return null;
		}
	} catch {
		return null;
	}
	await pool.query(
		`INSERT INTO cnpj_cache (cnpj, name, "fetchedAt") VALUES ($1, $2, $3)
		 ON CONFLICT (cnpj) DO UPDATE SET name = EXCLUDED.name, "fetchedAt" = EXCLUDED."fetchedAt"`,
		[cnpj, name, Date.now()]
	);
	return name;
}

// Each transaction's relevant CNPJ (receiver preferred, then payer), digits only.
const { rows } = await pool.query<{ id: string; counterparty: string | null; cnpj: string }>(`
  SELECT id, counterparty,
    regexp_replace(
      coalesce(
        CASE WHEN "raw"->'paymentData'->'receiver'->'documentNumber'->>'type' = 'CNPJ'
             THEN "raw"->'paymentData'->'receiver'->'documentNumber'->>'value' END,
        CASE WHEN "raw"->'paymentData'->'payer'->'documentNumber'->>'type' = 'CNPJ'
             THEN "raw"->'paymentData'->'payer'->'documentNumber'->>'value' END
      ), '\\D', '', 'g') AS cnpj
  FROM transactions
  WHERE "raw"->'paymentData'->'payer'->'documentNumber'->>'type' = 'CNPJ'
     OR "raw"->'paymentData'->'receiver'->'documentNumber'->>'type' = 'CNPJ'`);

console.log(`Found ${rows.length} transactions with a CNPJ document.`);

const now = Date.now();
let updated = 0;
let unresolved = 0;

for (const row of rows) {
	const name = await resolveCnpjName(row.cnpj);
	if (!name) {
		unresolved++;
		continue;
	}
	if (name === row.counterparty) continue;
	await pool.query(
		'UPDATE transactions SET "counterparty" = $1, "updatedAt" = $2 WHERE id = $3',
		[name, now, row.id]
	);
	updated++;
}

const distinct = await pool.query<{ name: string | null }>('SELECT count(*) FROM cnpj_cache');
console.log(
	`\nDone. Updated ${updated} row(s); ${unresolved} could not be resolved. ` +
		`Cached ${distinct.rows[0] ? '(see cnpj_cache)' : ''}.`
);
await pool.end();
