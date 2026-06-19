import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import {
	listPending,
	reviewTransaction,
	unreviewTransaction,
	updateTransaction
} from '$lib/db/transactions';
import { formatDate, money } from './format';
import type { CategoryOption, ExpenseCard } from './types';

// Reactive list of pending transactions, mapped to render-ready expense cards.
export function pendingExpenseCards() {
	return liveQuery(async () => {
		const [pending, accounts] = await Promise.all([listPending(), db.accounts.toArray()]);
		const accountName: Record<string, string> = Object.fromEntries(
			accounts.map((a) => [a.id, a.customName?.trim() || a.name])
		);
		const hiddenAccounts = new Set(accounts.filter((a) => a.hidden).map((a) => a.id));

		// Only outflows are reviewed in this flow; income is never "pending".
		return pending
			.filter((t) => t.direction === 'out' && !t.hidden && !hiddenAccounts.has(t.accountId))
			.map(
				(t): ExpenseCard => ({
					id: t.id!,
					title: t.title,
					description: t.description,
					amountLabel: money(t.amount),
					dateLabel: formatDate(t.date),
					accountName: accountName[t.accountId] ?? '',
					method: t.method,
					counterparty: t.counterparty
				})
			);
	});
}

// Reactive list of categories the user can assign during review.
export function categoryOptions() {
	return liveQuery(async () => {
		const categories = await db.categories.filter((c) => c.deleted !== 1).toArray();
		return categories.map((c): CategoryOption => ({ id: c.id!, name: c.name, classes: c.classes }));
	});
}

export function reviewExpense(id: string, categoryId: string) {
	return reviewTransaction(id, categoryId);
}

export function unreviewExpense(id: string) {
	return unreviewTransaction(id);
}

export function renameExpense(id: string, title: string) {
	return updateTransaction(id, { title });
}
