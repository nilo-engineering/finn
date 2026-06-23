import { db } from './index';
import type { Transaction } from './types';
import { requestSync } from '$lib/sync';
import { uuid } from './uuid';

type NewTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>;

export function addTransaction(tx: NewTransaction) {
	const now = Date.now();
	return db.transactions
		.add({ ...tx, id: uuid(), createdAt: now, updatedAt: now, deleted: 0 })
		.then((id) => {
			requestSync();
			return id;
		});
}

export function bulkAddTransactions(txs: NewTransaction[]) {
	const now = Date.now();
	return db.transactions
		.bulkAdd(
			txs.map((tx) => ({
				...tx,
				id: uuid(),
				createdAt: now,
				updatedAt: now,
				deleted: 0
			}))
		)
		.then((id) => {
			requestSync();
			return id;
		});
}

export async function updateTransaction(id: string, changes: Partial<Transaction>) {
	// Bump strictly past the row's current updatedAt so the edit wins the server's
	// last-write-wins gate even when the stored value came from the server clock
	// (bank-synced rows) and the browser clock lags behind it.
	const current = await db.transactions.get(id);
	const updatedAt = Math.max(Date.now(), (current?.updatedAt ?? 0) + 1);
	const updated = await db.transactions.update(id, { ...changes, updatedAt });
	requestSync();
	return updated;
}

export function setTransactionHidden(id: string, hidden: boolean) {
	return updateTransaction(id, { hidden });
}

// Soft delete: keep the row as a tombstone so the deletion propagates to the
// server (and any other client) on the next sync.
export function deleteTransaction(id: string) {
	return updateTransaction(id, { deleted: 1 });
}

// Categorize a pending transaction (replaces the console.log in ExpenseModal.selectCategory).
export function reviewTransaction(id: string, categoryId: string) {
	return updateTransaction(id, { categoryId, status: 'reviewed' });
}

// Reverse reviewTransaction: send the transaction back to the pending review queue.
export function unreviewTransaction(id: string) {
	return updateTransaction(id, { categoryId: null, status: 'pending' });
}

export function listPending() {
	return db.transactions
		.where('status')
		.equals('pending')
		.and((t) => t.deleted !== 1)
		.toArray();
}
