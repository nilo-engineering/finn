export type Direction = 'in' | 'out';
export type TxStatus = 'pending' | 'reviewed';

export interface Account {
	id?: number;
	name: string; // 'NuBank', 'BTG Pactual', 'CAIXA'
	type: string; // e.g. 'bank'
}

export interface Category {
	id?: number;
	name: string; // 'Fixed', 'Comfort', 'Indulgences', 'Self Improvement'
	classes: string; // Tailwind classes used to style the category
	budgetPercentage: number; // 0-100; this category's share of the period budget
}

export interface Transaction {
	id?: number;
	direction: Direction; // 'in' = money in, 'out' = money out
	amount: number; // always positive
	title: string;
	description: string;
	date: string; // ISO 'YYYY-MM-DD'
	time: string; // 'HH:mm' (24h); '00:00' when the source has no time component
	accountId: number; // FK -> Account.id
	categoryId: number | null; // FK -> Category.id; null until reviewed
	method: string; // 'Credit' | 'Debit'
	status: TxStatus; // 'pending' until categorized, then 'reviewed'
	createdAt: number; // Date.now() at insert
	sourceRow?: string; // original raw CSV line; only set on import
}
