// One-time backfill: fill `counterparty` for transactions that still have none,
// deriving the name from the description. For both directions:
//   - if the description has a "|", take the text after the LAST "|" (e.g.
//     "Compra no débito|SUPERMERCADOS BH" -> "SUPERMERCADOS BH",
//     "Transferência Recebida|Andre Ferraz" -> "Andre Ferraz");
//   - otherwise use the whole description as the name (card purchases like
//     "Padariatrigoreal"), UNLESS it is a generic system label with no real
//     payee (Pix, Pagamento*, IOF*, etc.), which is left null.
// Bumps updatedAt so clients re-pull. Safe to re-run (only touches null rows).
//
// Run with: node --env-file=.env --experimental-strip-types scripts/backfill-counterparty-from-description.ts
import pg from 'pg';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
	process.exit(1);
}

// No-pipe descriptions that are generic system labels, not a counterparty name.
// Compared case-insensitively against the trimmed full description.
const GENERIC_EXACT = new Set(
	[
		'Pix',
		'Transação de NuTag',
		'CardBankslip',
		'Resgate RDB',
		'Estorno de compra',
		'Ajuste a crédito',
		'Tef',
		'Depósito de empréstimo',
		'Valor recebido de Investimentos'
	].map((s) => s.toLowerCase())
);
// Generic prefixes (cover "Pagamento de fatura"/"Pagamento recebido",
// "IOF de compra internacional"/"IOF de volta de ...", "TedSalary", "Desconto Antecipação").
const GENERIC_PREFIX = ['pagamento', 'iof', 'ted', 'desconto antecipa'];

function isGeneric(desc: string): boolean {
	const d = desc.trim().toLowerCase();
	if (GENERIC_EXACT.has(d)) return true;
	return GENERIC_PREFIX.some((p) => d.startsWith(p));
}

// Returns the counterparty name to store, or null to skip.
function derive(description: string): string | null {
	const pipe = description.lastIndexOf('|');
	if (pipe >= 0) {
		const name = description.slice(pipe + 1).trim();
		return name || null;
	}
	const name = description.trim();
	if (!name || isGeneric(name)) return null;
	return name;
}

pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query<{ id: string; description: string; direction: string }>(
	'SELECT id, description, direction FROM transactions WHERE "counterparty" IS NULL'
);
console.log(`Scanning ${rows.length} transactions with no counterparty.`);

const now = Date.now();
let updated = 0;
let skipped = 0;
const byDir: Record<string, number> = { in: 0, out: 0 };

for (const row of rows) {
	const name = derive(row.description);
	if (name === null) {
		skipped++;
		continue;
	}
	await pool.query(
		'UPDATE transactions SET "counterparty" = $1, "updatedAt" = $2 WHERE id = $3',
		[name, now, row.id]
	);
	updated++;
	byDir[row.direction] = (byDir[row.direction] ?? 0) + 1;
}

console.log(
	`\nDone. Updated ${updated} (in: ${byDir.in ?? 0}, out: ${byDir.out ?? 0}), ` +
		`left ${skipped} generic/empty rows blank.`
);
await pool.end();
