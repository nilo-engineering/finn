// View models: render-ready shapes consumed directly by pages and components.

import type { Direction } from '$lib/db/types';

export type Period = 'Year' | 'Month' | 'Week';

export type BudgetView = {
	primaryLabel: string; // "Total" or a category name, e.g. "Comfort"
	secondaryLabel: string; // "$1,500 / $2,500"
	percentage: number;
};

// One period's budget: an overall total bar plus a bar per category.
export type PeriodBudget = {
	total: BudgetView;
	categories: BudgetView[];
};

export type PeriodOption = {
	name: string;
	label: string;
};

export type ExpenseCard = {
	id: string;
	title: string;
	description: string;
	amountLabel: string; // "$6.50"
	dateLabel: string; // "Jun 6, 2026"
	accountName: string; // "NuBank"
	method: string; // "Credit"
	counterparty?: string; // the other party (receiver/merchant); absent when unknown
};

export type TransactionView = {
	id: string;
	title: string;
	description: string;
	monthLabel: string; // "June 2026" — used to group rows under month headers
	dateLabel: string; // "Jun 6, 2026"
	amountLabel: string; // "$6.50"
	direction: Direction; // drives amount color and sign
	accountName: string; // "NuBank"
	categoryId: string | null; // null = Uncategorized; drives the category picker's current selection
	categoryName: string; // "Comfort" or "Uncategorized"
	method: string; // "Credit" or "Debit"
	counterparty?: string; // the other party (receiver/merchant); absent when unknown
	hidden: boolean; // dims the row; excluded from dashboard
};

export type CategoryOption = {
	id: string;
	name: string;
	classes: string;
};

export type AccountView = {
	id: string;
	name: string; // bank/provider name (read-only)
	customName?: string; // optional user label; overrides `name` for display when set
	txCount: number; // transactions referencing this account; >0 blocks delete
	hidden: boolean; // its transactions are excluded from the dashboard
};

export type CategoryView = {
	id: string;
	name: string;
	classes: string;
	budgetPercentage: number;
	txCount: number; // transactions referencing this category; >0 blocks delete
};
