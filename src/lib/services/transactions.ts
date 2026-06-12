import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import type { Account } from '$lib/db/types';
import { bulkAddTransactions, updateTransaction } from '$lib/db/transactions';
import { parseCsv } from '$lib/import/csv';
import {
	detectProfile,
	recordsToTransactions,
	type NewTransaction,
	type RowError
} from '$lib/import/parse';
import { profileById } from '$lib/import/profiles';
import type { ImportProfile } from '$lib/import/types';
import { formatDate, formatMonth, money } from './format';
import type { TransactionView } from './types';

// Reactive list of every transaction, newest first, mapped to render-ready rows.
export function transactionList() {
	return liveQuery(async () => {
		const [txs, accounts, categories] = await Promise.all([
			db.transactions.toArray(),
			db.accounts.toArray(),
			db.categories.toArray()
		]);
		const accountName: Record<number, string> = Object.fromEntries(
			accounts.map((a) => [a.id, a.name])
		);
		const categoryName: Record<number, string> = Object.fromEntries(
			categories.map((c) => [c.id, c.name])
		);

		// `date` is day-granular, so fall back to `time` then `createdAt` to keep
		// same-day transactions in a stable newest-first order.
		txs.sort(
			(a, b) =>
				b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.createdAt - a.createdAt
		);

		return txs.map(
			(t): TransactionView => ({
				id: t.id!,
				title: t.title,
				monthLabel: formatMonth(t.date),
				dateLabel: formatDate(t.date),
				amountLabel: money(t.amount),
				direction: t.direction,
				accountName: accountName[t.accountId] ?? '',
				categoryName: t.categoryId !== null ? (categoryName[t.categoryId] ?? '') : 'Uncategorized'
			})
		);
	});
}

export function renameTransaction(id: number, title: string) {
	return updateTransaction(id, { title });
}

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
