import { db } from '$lib/db';
import type { Account } from '$lib/db/types';
import { bulkAddTransactions } from '$lib/db/transactions';
import { parseCsv } from '$lib/import/csv';
import {
	detectProfile,
	recordsToTransactions,
	type NewTransaction,
	type RowError
} from '$lib/import/parse';
import { profileById } from '$lib/import/profiles';
import type { ImportProfile } from '$lib/import/types';

export interface ImportPreview {
	profile: ImportProfile | null; // null when auto-detect found no match
	accountFound: boolean; // false when the profile's account doesn't exist yet
	txs: NewTransaction[];
	errors: RowError[]; // per-row parse failures
	error?: string; // top-level failure (e.g. wrong profile -> missing columns)
}

// Resolve a profile's account name to an existing Account (trim + case-insensitive).
async function accountByName(name: string): Promise<Account | undefined> {
	const target = name.trim().toLowerCase();
	const all = await db.accounts.toArray();
	return all.find((a) => a.name.trim().toLowerCase() === target);
}

// Parse a CSV file into ready-to-insert transactions without touching the DB.
// When `profileId` is given (manual fallback) it is used; otherwise the profile is
// auto-detected from the header signature.
export async function previewImport(file: File, profileId?: string): Promise<ImportPreview> {
	const text = await file.text();

	let profile: ImportProfile | null;
	if (profileId) {
		profile = profileById(profileId) ?? null;
	} else {
		// All current formats are comma-delimited, so sniff the header with ','.
		const sniff = parseCsv(text, ',');
		profile = detectProfile(sniff[0]?.fields ?? []);
	}

	if (!profile) {
		return { profile: null, accountFound: false, txs: [], errors: [] };
	}

	const account = await accountByName(profile.accountName);
	if (!account || account.id === undefined) {
		return { profile, accountFound: false, txs: [], errors: [] };
	}

	try {
		const records = parseCsv(text, profile.delimiter);
		const { txs, errors } = recordsToTransactions(records, profile, account.id);
		return { profile, accountFound: true, txs, errors };
	} catch (e) {
		return {
			profile,
			accountFound: true,
			txs: [],
			errors: [],
			error: e instanceof Error ? e.message : String(e)
		};
	}
}

// Insert the previewed transactions. Returns how many were written.
export async function commitImport(txs: NewTransaction[]): Promise<number> {
	if (txs.length === 0) return 0;
	await bulkAddTransactions(txs);
	return txs.length;
}
