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

export function updateCategory(id: string, changes: Partial<Category>) {
	return db.categories.update(id, { ...changes, updatedAt: Date.now() }).then((updated) => {
		requestSync();
		return updated;
	});
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
