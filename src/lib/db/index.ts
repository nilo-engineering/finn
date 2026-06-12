import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Transaction, SyncMeta } from './types';
// import { seed } from './seed';

export type FinnDB = Dexie & {
	accounts: EntityTable<Account, 'id'>;
	categories: EntityTable<Category, 'id'>;
	transactions: EntityTable<Transaction, 'id'>;
	syncMeta: EntityTable<SyncMeta, 'key'>;
};

export const db = new Dexie('finn') as FinnDB;

db.version(1).stores({
	accounts: '++id, &name',
	categories: '++id, &name',
	budgets: '++id, &[period+categoryId], period, categoryId',
	transactions: '++id, status, direction, date, accountId, categoryId, [status+direction]'
});

// v2: per-category budgets became a `budgetPercentage` field on Category, so the
// budgets table is no longer needed.
db.version(2).stores({ budgets: null });

// v3: server sync. `updatedAt` is indexed so the engine can pull a delta
// (`where('updatedAt').above(cursor)`); `syncMeta` holds the sync cursors.
// Existing rows are backfilled so they join the first sync.
db.version(3)
	.stores({
		accounts: '++id, &name, updatedAt',
		categories: '++id, &name, updatedAt',
		transactions:
			'++id, status, direction, date, accountId, categoryId, [status+direction], updatedAt',
		syncMeta: 'key'
	})
	.upgrade(async (tx) => {
		for (const table of ['accounts', 'categories', 'transactions'] as const) {
			await tx
				.table(table)
				.toCollection()
				.modify((row) => {
					row.updatedAt ??= row.createdAt ?? Date.now();
					row.deleted ??= 0;
				});
		}
	});

// Runs once, only when the DB is first created.
// db.on('populate', () => seed(db));
