// View models: render-ready shapes consumed directly by pages and components.

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
	id: number;
	title: string;
	description: string;
	amountLabel: string; // "$6.50"
	dateLabel: string; // "Jun 6, 2026"
	accountName: string; // "NuBank"
	method: string; // "Credit"
};

export type CategoryOption = {
	id: number;
	name: string;
	classes: string;
};
