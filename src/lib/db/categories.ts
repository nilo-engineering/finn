import { db } from './index';
import type { Category } from './types';
import { requestSync } from '$lib/sync';
import { uuid } from './uuid';

export function addCategory(cat: Omit<Category, 'id' | 'updatedAt' | 'deleted'>) {
	return db.categories
		.add({ ...cat, id: uuid(), updatedAt: Date.now(), deleted: 0 })
		.then((id) => {
			requestSync();
			return id;
		});
}

export async function updateCategory(id: string, changes: Partial<Category>) {
	// Bump strictly past the row's current updatedAt so the edit wins the server's
	// last-write-wins gate even when the stored value came from the server clock
	// (bank-synced rows) and the browser clock lags behind it.
	const current = await db.categories.get(id);
	const updatedAt = Math.max(Date.now(), (current?.updatedAt ?? 0) + 1);
	const updated = await db.categories.update(id, { ...changes, updatedAt });
	requestSync();
	return updated;
}

// Soft delete: keep the row as a tombstone so the deletion syncs to the server.
export function deleteCategory(id: string) {
	return updateCategory(id, { deleted: 1 });
}

// Number of live transactions referencing this category; a non-zero count blocks
// deletion so we never orphan transactions.
export function countCategoryTransactions(id: string) {
	return db.transactions
		.where('categoryId')
		.equals(id)
		.and((t) => t.deleted !== 1)
		.count();
}
