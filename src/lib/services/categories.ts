import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import {
	addCategory,
	updateCategory,
	deleteCategory,
	countCategoryTransactions
} from '$lib/db/categories';
import type { CategoryView } from './types';

// Reactive list of categories, sorted by name, each annotated with the number
// of transactions referencing it (so the UI can guard deletion).
export function categoryList() {
	return liveQuery(async () => {
		const categories = await db.categories.toArray();
		const views = await Promise.all(
			categories.map(
				async (c): Promise<CategoryView> => ({
					id: c.id!,
					name: c.name,
					classes: c.classes,
					budgetPercentage: c.budgetPercentage,
					txCount: await countCategoryTransactions(c.id!)
				})
			)
		);
		return views.sort((a, b) => a.name.localeCompare(b.name));
	});
}

// New categories start at 0%; the allocation can be adjusted afterwards.
export function createCategory(name: string, classes: string) {
	return addCategory({ name: name.trim(), classes, budgetPercentage: 0 });
}

export function renameCategory(id: number, name: string, classes: string) {
	return updateCategory(id, { name: name.trim(), classes });
}

export function removeCategory(id: number) {
	return deleteCategory(id);
}

export function updateBudgetPercentage(id: number, budgetPercentage: number) {
	return updateCategory(id, { budgetPercentage });
}
