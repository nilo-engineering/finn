import { db } from './index';
import type { Transaction } from './types';

export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
	return db.transactions.add({ ...tx, createdAt: Date.now() });
}

export function bulkAddTransactions(txs: Omit<Transaction, 'id' | 'createdAt'>[]) {
	const now = Date.now();
	return db.transactions.bulkAdd(txs.map((tx) => ({ ...tx, createdAt: now })));
}

export function updateTransaction(id: number, changes: Partial<Transaction>) {
	return db.transactions.update(id, changes);
}

export function setTransactionHidden(id: number, hidden: boolean) {
	return updateTransaction(id, { hidden });
}

export function deleteTransaction(id: number) {
	return db.transactions.delete(id);
}

// Categorize a pending transaction (replaces the console.log in ExpenseModal.selectCategory).
export function reviewTransaction(id: number, categoryId: number) {
	return db.transactions.update(id, { categoryId, status: 'reviewed' });
}

// Reverse reviewTransaction: send the transaction back to the pending review queue.
export function unreviewTransaction(id: number) {
	return db.transactions.update(id, { categoryId: null, status: 'pending' });
}

export function listPending() {
	return db.transactions.where('status').equals('pending').toArray();
}
