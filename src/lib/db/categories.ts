import { db } from './index';
import type { Category } from './types';

export function addCategory(cat: Omit<Category, 'id'>) {
	return db.categories.add(cat);
}

export function updateCategory(id: number, changes: Partial<Category>) {
	return db.categories.update(id, changes);
}

export function deleteCategory(id: number) {
	return db.categories.delete(id);
}

// Number of transactions referencing this category; a non-zero count blocks
// deletion so we never orphan transactions.
export function countCategoryTransactions(id: number) {
	return db.transactions.where('categoryId').equals(id).count();
}
