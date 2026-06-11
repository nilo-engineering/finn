import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Transaction } from './types';
// import { seed } from './seed';

export type FinnDB = Dexie & {
	accounts: EntityTable<Account, 'id'>;
	categories: EntityTable<Category, 'id'>;
	transactions: EntityTable<Transaction, 'id'>;
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

// Runs once, only when the DB is first created.
// db.on('populate', () => seed(db));
