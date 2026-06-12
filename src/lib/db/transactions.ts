import { db } from './index';
import type { Transaction } from './types';
import { requestSync } from '$lib/sync';

type NewTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>;

export function addTransaction(tx: NewTransaction) {
	const now = Date.now();
	return db.transactions.add({ ...tx, createdAt: now, updatedAt: now, deleted: 0 }).then((id) => {
		requestSync();
		return id;
	});
}

export function bulkAddTransactions(txs: NewTransaction[]) {
	const now = Date.now();
	return db.transactions
		.bulkAdd(txs.map((tx) => ({ ...tx, createdAt: now, updatedAt: now, deleted: 0 })))
		.then((id) => {
			requestSync();
			return id;
		});
}

export function updateTransaction(id: number, changes: Partial<Transaction>) {
	return db.transactions.update(id, { ...changes, updatedAt: Date.now() }).then((updated) => {
		requestSync();
		return updated;
	});
}

export function setTransactionHidden(id: number, hidden: boolean) {
	return updateTransaction(id, { hidden });
}

// Soft delete: keep the row as a tombstone so the deletion propagates to the
// server (and any other client) on the next sync.
export function deleteTransaction(id: number) {
	return updateTransaction(id, { deleted: 1 });
}

// Categorize a pending transaction (replaces the console.log in ExpenseModal.selectCategory).
export function reviewTransaction(id: number, categoryId: number) {
	return updateTransaction(id, { categoryId, status: 'reviewed' });
}

// Reverse reviewTransaction: send the transaction back to the pending review queue.
export function unreviewTransaction(id: number) {
	return updateTransaction(id, { categoryId: null, status: 'pending' });
}

export function listPending() {
	return db.transactions
		.where('status')
		.equals('pending')
		.and((t) => t.deleted !== 1)
		.toArray();
}
