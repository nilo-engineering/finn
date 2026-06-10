import type { FinnDB } from './index';
import type { Account, Budget, Category, Period, Transaction } from './types';

const categories: Category[] = [
	{ name: 'Fixed', classes: 'bg-accent text-white' },
	{ name: 'Comfort', classes: 'bg-primary text-white' },
	{ name: 'Indulgences', classes: 'bg-highlight text-ink' },
	{ name: 'Self Improvement', classes: 'bg-alert text-white' }
];

const accounts: Account[] = [
	{ name: 'NuBank', type: 'bank' },
	{ name: 'BTG Pactual', type: 'bank' },
	{ name: 'CAIXA', type: 'bank' }
];

// Spending limit per category, per period (derived from the dashboard mock).
const budgetLimits: Record<Period, Record<string, number>> = {
	Year: { Fixed: 21600, Comfort: 7200, Indulgences: 3600, 'Self Improvement': 3000 },
	Month: { Fixed: 1800, Comfort: 600, Indulgences: 300, 'Self Improvement': 250 },
	Week: { Fixed: 450, Comfort: 150, Indulgences: 75, 'Self Improvement': 63 }
};

// Pending money-out transactions awaiting categorization (from the review-flow mock).
const pendingOutflows = [
	{
		title: 'Coffee shop',
		description: 'Morning latte at Blue Bottle',
		amount: 6.5,
		date: '2026-06-06',
		account: 'NuBank',
		method: 'Credit'
	},
	{
		title: 'Spotify',
		description: 'Monthly subscription',
		amount: 19.9,
		date: '2026-06-04',
		account: 'NuBank',
		method: 'Credit'
	},
	{
		title: 'Uber',
		description: 'Ride home from office',
		amount: 14.2,
		date: '2026-06-03',
		account: 'BTG Pactual',
		method: 'Debit'
	},
	{
		title: 'Grocery store',
		description: 'Weekly groceries at Pão de Açúcar',
		amount: 87.4,
		date: '2026-06-02',
		account: 'CAIXA',
		method: 'Debit'
	}
];

/**
 * Populates a freshly created database with initial data. Wired to Dexie's
 * `populate` event, so it runs exactly once when the DB is first created and
 * executes inside the upgrade transaction.
 */
export async function seed(db: FinnDB): Promise<void> {
	const categoryIds = await db.categories.bulkAdd(categories, { allKeys: true });
	const accountIds = await db.accounts.bulkAdd(accounts, { allKeys: true });

	const categoryIdByName = new Map(categories.map((c, i) => [c.name, categoryIds[i]]));
	const accountIdByName = new Map(accounts.map((a, i) => [a.name, accountIds[i]]));

	const budgets: Budget[] = [];
	for (const period of Object.keys(budgetLimits) as Period[]) {
		for (const [name, limit] of Object.entries(budgetLimits[period])) {
			budgets.push({ period, categoryId: categoryIdByName.get(name)!, limit });
		}
	}
	await db.budgets.bulkAdd(budgets);

	const now = Date.now();
	const transactions: Transaction[] = pendingOutflows.map((tx) => ({
		direction: 'out',
		amount: tx.amount,
		title: tx.title,
		description: tx.description,
		date: tx.date,
		accountId: accountIdByName.get(tx.account)!,
		categoryId: null,
		method: tx.method,
		status: 'pending',
		createdAt: now
	}));
	await db.transactions.bulkAdd(transactions);
}
