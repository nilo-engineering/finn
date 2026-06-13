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

// `id` (no `++`) is a caller-supplied string primary key (crypto.randomUUID),
// minted client- and server-side so rows the server ingests (Open Finance /
// Pluggy) never collide with locally created ones. `updatedAt` is indexed so the
// sync engine can pull a delta (`where('updatedAt').above(cursor)`); `syncMeta`
// holds the sync cursors.
db.version(1).stores({
	accounts: 'id, &name, updatedAt',
	categories: 'id, &name, updatedAt',
	transactions: 'id, status, direction, date, accountId, categoryId, [status+direction], updatedAt',
	syncMeta: 'key'
});

// Runs once, only when the DB is first created.
// db.on('populate', () => seed(db));
