import type { FinnDB } from './index';
import type { Account, Category, Transaction } from './types';

// `budgetPercentage` is each category's share of the period budget (sums to 100).
const categories: Category[] = [
	{ name: 'Fixed', classes: 'bg-accent text-white', budgetPercentage: 50 },
	{ name: 'Comfort', classes: 'bg-primary text-white', budgetPercentage: 25 },
	{ name: 'Indulgences', classes: 'bg-highlight text-ink', budgetPercentage: 15 },
	{ name: 'Self Improvement', classes: 'bg-alert text-white', budgetPercentage: 10 }
];

const accounts: Account[] = [
	{ name: 'NuBank', type: 'bank' },
	{ name: 'BTG Pactual', type: 'bank' },
	{ name: 'CAIXA', type: 'bank' }
];

// Monthly salary deposits for the current year. Drives the income-derived budget
// limits (Year = total, Month = /12, Week = /52).
const incomeDeposits = ['01', '02', '03', '04', '05', '06'].map((month) => ({
	date: `2026-${month}-01`,
	amount: 5000,
	account: 'NuBank'
}));

// Already-categorized expenses so the dashboard bars are non-zero out of the box.
// Dates span the current week (Jun 7-13), the current month, and an earlier month
// so the Week / Month / Year totals differ.
const reviewedExpenses = [
	{ title: 'Rent share', amount: 1200, date: '2026-06-08', account: 'NuBank', method: 'Debit', category: 'Fixed' },
	{ title: 'Dinner out', amount: 90, date: '2026-06-09', account: 'BTG Pactual', method: 'Credit', category: 'Comfort' },
	{ title: 'Headphones', amount: 150, date: '2026-06-10', account: 'NuBank', method: 'Credit', category: 'Indulgences' },
	{ title: 'Online course', amount: 60, date: '2026-06-07', account: 'NuBank', method: 'Credit', category: 'Self Improvement' },
	{ title: 'Internet bill', amount: 80, date: '2026-06-02', account: 'CAIXA', method: 'Debit', category: 'Fixed' },
	{ title: 'Concert tickets', amount: 300, date: '2026-03-15', account: 'BTG Pactual', method: 'Credit', category: 'Comfort' }
];

// Pending money-out transactions awaiting categorization (review-flow demo).
const pendingOutflows = [
	{ title: 'Coffee shop', description: 'Morning latte at Blue Bottle', amount: 6.5, date: '2026-06-06', account: 'NuBank', method: 'Credit' },
	{ title: 'Spotify', description: 'Monthly subscription', amount: 19.9, date: '2026-06-04', account: 'NuBank', method: 'Credit' },
	{ title: 'Uber', description: 'Ride home from office', amount: 14.2, date: '2026-06-03', account: 'BTG Pactual', method: 'Debit' },
	{ title: 'Grocery store', description: 'Weekly groceries at Pão de Açúcar', amount: 87.4, date: '2026-06-02', account: 'CAIXA', method: 'Debit' }
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

	const now = Date.now();

	const income: Transaction[] = incomeDeposits.map((d) => ({
		direction: 'in',
		amount: d.amount,
		title: 'Salary',
		description: 'Monthly salary',
		date: d.date,
		accountId: accountIdByName.get(d.account)!,
		categoryId: null,
		method: 'Deposit',
		status: 'reviewed',
		createdAt: now
	}));

	const reviewed: Transaction[] = reviewedExpenses.map((e) => ({
		direction: 'out',
		amount: e.amount,
		title: e.title,
		description: e.title,
		date: e.date,
		accountId: accountIdByName.get(e.account)!,
		categoryId: categoryIdByName.get(e.category)!,
		method: e.method,
		status: 'reviewed',
		createdAt: now
	}));

	const pending: Transaction[] = pendingOutflows.map((tx) => ({
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

	await db.transactions.bulkAdd([...income, ...reviewed, ...pending]);
}
