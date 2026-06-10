export type Direction = 'in' | 'out';
export type TxStatus = 'pending' | 'reviewed';
export type Period = 'Year' | 'Month' | 'Week';

export interface Account {
	id?: number;
	name: string; // 'NuBank', 'BTG Pactual', 'CAIXA'
	type: string; // e.g. 'bank'
}

export interface Category {
	id?: number;
	name: string; // 'Fixed', 'Comfort', 'Indulgences', 'Self Improvement'
	classes: string; // Tailwind classes used to style the category
}

export interface Budget {
	id?: number;
	period: Period;
	categoryId: number; // FK -> Category.id
	limit: number; // spending limit for that category + period
}

export interface Transaction {
	id?: number;
	direction: Direction; // 'in' = money in, 'out' = money out
	amount: number; // always positive
	title: string;
	description: string;
	date: string; // ISO 'YYYY-MM-DD'
	accountId: number; // FK -> Account.id
	categoryId: number | null; // FK -> Category.id; null until reviewed
	method: string; // 'Credit' | 'Debit'
	status: TxStatus; // 'pending' until categorized, then 'reviewed'
	createdAt: number; // Date.now() at insert
}
