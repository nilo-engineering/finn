import { db } from './index';
import type { Account } from './types';
import { requestSync } from '$lib/sync';
import { uuid } from './uuid';

export function addAccount(acc: Omit<Account, 'id' | 'updatedAt' | 'deleted'>) {
	return db.accounts
		.add({ ...acc, id: uuid(), updatedAt: Date.now(), deleted: 0 })
		.then((id) => {
			requestSync();
			return id;
		});
}

export async function updateAccount(id: string, changes: Partial<Account>) {
	// Bump strictly past the row's current updatedAt so the edit wins the server's
	// last-write-wins gate even when the stored value came from the server clock
	// (bank-synced rows) and the browser clock lags behind it.
	const current = await db.accounts.get(id);
	const updatedAt = Math.max(Date.now(), (current?.updatedAt ?? 0) + 1);
	const updated = await db.accounts.update(id, { ...changes, updatedAt });
	requestSync();
	return updated;
}

// Soft delete: keep the row as a tombstone so the deletion syncs to the server.
export function deleteAccount(id: string) {
	return updateAccount(id, { deleted: 1 });
}

export function setAccountHidden(id: string, hidden: boolean) {
	return updateAccount(id, { hidden });
}

// Store undefined for a blank custom name so display falls back to the bank name.
export function setAccountCustomName(id: string, customName: string) {
	const trimmed = customName.trim();
	return updateAccount(id, { customName: trimmed || undefined });
}

// Number of live transactions referencing this account; a non-zero count blocks
// deletion so we never orphan transactions.
export function countAccountTransactions(id: string) {
	return db.transactions
		.where('accountId')
		.equals(id)
		.and((t) => t.deleted !== 1)
		.count();
}
