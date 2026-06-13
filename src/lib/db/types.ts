export type Direction = 'in' | 'out';
export type TxStatus = 'pending' | 'reviewed';

// Fields every synced record carries so the engine can compute deltas and
// propagate deletes under last-write-wins. See src/lib/sync.
export interface Syncable {
	updatedAt: number; // Date.now() of the last local write; the LWW comparison key
	deleted?: 0 | 1; // 1 = tombstone (soft delete); absent/0 = live
}

export interface Account extends Syncable {
	id?: string; // UUID minted at insert (crypto.randomUUID)
	name: string; // 'NuBank', 'BTG Pactual', 'CAIXA'
	type: string; // e.g. 'bank'
}

export interface Category extends Syncable {
	id?: string; // UUID minted at insert (crypto.randomUUID)
	name: string; // 'Fixed', 'Comfort', 'Indulgences', 'Self Improvement'
	classes: string; // Tailwind classes used to style the category
	budgetPercentage: number; // 0-100; this category's share of the period budget
}

export interface Transaction extends Syncable {
	id?: string; // UUID minted at insert (crypto.randomUUID)
	direction: Direction; // 'in' = money in, 'out' = money out
	amount: number; // always positive
	title: string;
	description: string;
	date: string; // ISO 'YYYY-MM-DD'
	time: string; // 'HH:mm' (24h); '00:00' when the source has no time component
	accountId: string; // FK -> Account.id
	categoryId: string | null; // FK -> Category.id; null until reviewed
	method: string; // 'Credit' | 'Debit'
	status: TxStatus; // 'pending' until categorized, then 'reviewed'
	hidden?: boolean; // excluded from dashboard aggregations; absent = visible
	createdAt: number; // Date.now() at insert
	sourceRow?: string; // original raw CSV line; only set on import
}

// Single-row cursors the sync engine persists (lastPulledAt / lastPushedAt).
export interface SyncMeta {
	key: string;
	value: number;
}
