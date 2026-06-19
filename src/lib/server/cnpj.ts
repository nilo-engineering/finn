import { pool } from './db';

// OpenCNPJ (https://opencnpj.org) — free public CNPJ lookup. Resolves a CNPJ to a
// display name, preferring the trade name (nome_fantasia) and falling back to the legal
// name (razao_social). Results are cached in cnpj_cache (including negatives) so each
// CNPJ hits the network at most once. Returns null when the CNPJ is unknown/invalid or
// the lookup fails transiently (transient failures are not cached, so they retry later).
export async function resolveCnpjName(rawCnpj: string): Promise<string | null> {
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
			name = null; // genuinely not found -> negative cache
		} else {
			return null; // transient (5xx/429) -> don't cache, retry next time
		}
	} catch {
		return null; // network/parse error -> don't cache
	}

	await pool.query(
		`INSERT INTO cnpj_cache (cnpj, name, "fetchedAt") VALUES ($1, $2, $3)
		 ON CONFLICT (cnpj) DO UPDATE SET name = EXCLUDED.name, "fetchedAt" = EXCLUDED."fetchedAt"`,
		[cnpj, name, Date.now()]
	);
	return name;
}
