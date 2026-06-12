import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import {
	addAccount,
	updateAccount,
	deleteAccount,
	countAccountTransactions
} from '$lib/db/accounts';
import type { AccountView } from './types';

// Reactive list of accounts, sorted by name, each annotated with the number of
// transactions referencing it (so the UI can guard deletion).
export function accountList() {
	return liveQuery(async () => {
		const accounts = await db.accounts.filter((a) => a.deleted !== 1).toArray();
		const views = await Promise.all(
			accounts.map(
				async (a): Promise<AccountView> => ({
					id: a.id!,
					name: a.name,
					txCount: await countAccountTransactions(a.id!)
				})
			)
		);
		return views.sort((a, b) => a.name.localeCompare(b.name));
	});
}

export function createAccount(name: string) {
	return addAccount({ name: name.trim(), type: 'bank' });
}

export function renameAccount(id: number, name: string) {
	return updateAccount(id, { name: name.trim() });
}

export function removeAccount(id: number) {
	return deleteAccount(id);
}
