import { db } from './index';
import type { Account } from './types';
import { requestSync } from '$lib/sync';

export function addAccount(acc: Omit<Account, 'id' | 'updatedAt' | 'deleted'>) {
	return db.accounts.add({ ...acc, updatedAt: Date.now(), deleted: 0 }).then((id) => {
		requestSync();
		return id;
	});
}

export function updateAccount(id: number, changes: Partial<Account>) {
	return db.accounts.update(id, { ...changes, updatedAt: Date.now() }).then((updated) => {
		requestSync();
		return updated;
	});
}

// Soft delete: keep the row as a tombstone so the deletion syncs to the server.
export function deleteAccount(id: number) {
	return updateAccount(id, { deleted: 1 });
}

// Number of live transactions referencing this account; a non-zero count blocks
// deletion so we never orphan transactions.
export function countAccountTransactions(id: number) {
	return db.transactions
		.where('accountId')
		.equals(id)
		.and((t) => t.deleted !== 1)
		.count();
}
