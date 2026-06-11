import { db } from './index';
import type { Account } from './types';

export function addAccount(acc: Omit<Account, 'id'>) {
	return db.accounts.add(acc);
}

export function updateAccount(id: number, changes: Partial<Account>) {
	return db.accounts.update(id, changes);
}

export function deleteAccount(id: number) {
	return db.accounts.delete(id);
}

// Number of transactions referencing this account; a non-zero count blocks
// deletion so we never orphan transactions.
export function countAccountTransactions(id: number) {
	return db.transactions.where('accountId').equals(id).count();
}
