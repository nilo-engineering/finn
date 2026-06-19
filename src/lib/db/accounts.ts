import { db } from './index';
import type { Account } from './types';
import { requestSync } from '$lib/sync';

export function addAccount(acc: Omit<Account, 'id' | 'updatedAt' | 'deleted'>) {
	return db.accounts
		.add({ ...acc, id: crypto.randomUUID(), updatedAt: Date.now(), deleted: 0 })
		.then((id) => {
			requestSync();
			return id;
		});
}

export function updateAccount(id: string, changes: Partial<Account>) {
	return db.accounts.update(id, { ...changes, updatedAt: Date.now() }).then((updated) => {
		requestSync();
		return updated;
	});
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
