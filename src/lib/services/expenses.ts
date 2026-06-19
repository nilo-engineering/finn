import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import {
	listPending,
	reviewTransaction,
	unreviewTransaction,
	setTransactionHidden,
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

		// `date` is day-granular, so fall back to `time` then `createdAt` to keep
		// same-day transactions in a stable order.
		pending.sort(
			(a, b) =>
				b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.createdAt - a.createdAt
		);

		// Future-dated transactions (e.g. scheduled/not-yet-settled) shouldn't be
		// reviewed yet. 'en-CA' gives a local 'YYYY-MM-DD' that compares against `date`.
		const today = new Date().toLocaleDateString('en-CA');

		// Only outflows are reviewed in this flow; income is never "pending".
		return pending
			.filter(
				(t) =>
					t.direction === 'out' &&
					!t.hidden &&
					!hiddenAccounts.has(t.accountId) &&
					t.date <= today
			)
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

export function hideExpense(id: string) {
	return setTransactionHidden(id, true);
}

export function unhideExpense(id: string) {
	return setTransactionHidden(id, false);
}
