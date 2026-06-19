import { liveQuery } from 'dexie';
import { db } from '$lib/db';
import { wholeMoney } from './format';
import type { BudgetView, Period, PeriodBudget, PeriodOption } from './types';

const PERIODS: Period[] = ['Year', 'Month', 'Week'];

export const periodOptions: PeriodOption[] = PERIODS.map((p) => ({ name: p, label: p }));

// Parse an ISO 'YYYY-MM-DD' string as a local date (avoids the UTC-midnight shift).
function parseLocalDate(iso: string): Date {
	const [year, month, day] = iso.split('-').map(Number);
	return new Date(year, month - 1, day);
}

// Inclusive [start, end] window a period covers, relative to today.
function periodWindow(period: Period): { start: Date; end: Date } {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const date = now.getDate();
	if (period === 'Year') {
		return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
	}
	if (period === 'Month') {
		return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0, 23, 59, 59, 999) };
	}
	// Week: Sunday-Saturday of the current week.
	const sunday = date - now.getDay();
	return {
		start: new Date(year, month, sunday),
		end: new Date(year, month, sunday + 6, 23, 59, 59, 999)
	};
}

function inWindow(iso: string, window: { start: Date; end: Date }): boolean {
	const d = parseLocalDate(iso);
	return d >= window.start && d <= window.end;
}

// Periods elapsed in the current year so far, current period included. Used to
// average year-to-date income across the months/weeks that produced it, rather
// than across the full year (which would deflate limits early in the year).
function periodsElapsed(): Record<Period, number> {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfYear = new Date(now.getFullYear(), 0, 1);
	const dayOfYear = Math.round((today.getTime() - startOfYear.getTime()) / 86400000) + 1;
	return {
		Year: 1,
		Month: now.getMonth() + 1,
		Week: Math.ceil((dayOfYear + startOfYear.getDay()) / 7)
	};
}

function toBar(primaryLabel: string, accumulated: number, limit: number): BudgetView {
	return {
		primaryLabel,
		secondaryLabel: `${wholeMoney(accumulated)} / ${wholeMoney(limit)}`,
		percentage: limit > 0 ? Math.round((accumulated / limit) * 100) : 0
	};
}

// Reactive, income-derived budgets per period. The total limit comes from the
// year's income averaged over the periods elapsed so far (Year = total,
// Month = /months elapsed, Week = /weeks elapsed); accumulated is the sum of
// reviewed outflows in the period window; each category takes a fixed
// percentage of the total limit.
export function budgetBars() {
	return liveQuery(async () => {
		const [categories, transactions, accounts] = await Promise.all([
			db.categories.filter((c) => c.deleted !== 1).toArray(),
			db.transactions.filter((t) => t.deleted !== 1).toArray(),
			db.accounts.filter((a) => a.deleted !== 1).toArray()
		]);

		const hiddenAccounts = new Set(accounts.filter((a) => a.hidden).map((a) => a.id));

		const yearWindow = periodWindow('Year');
		const yearlyIncome = transactions
			.filter(
				(t) =>
					t.direction === 'in' &&
					!t.hidden &&
					!hiddenAccounts.has(t.accountId) &&
					inWindow(t.date, yearWindow)
			)
			.reduce((sum, t) => sum + t.amount, 0);

		const elapsed = periodsElapsed();
		const totalLimit: Record<Period, number> = {
			Year: yearlyIncome,
			Month: yearlyIncome / elapsed.Month,
			Week: yearlyIncome / elapsed.Week
		};

		const result: Record<string, PeriodBudget> = {};
		for (const period of PERIODS) {
			const window = periodWindow(period);
			const outflows = transactions.filter(
				(t) =>
					t.direction === 'out' &&
					t.status === 'reviewed' &&
					!t.hidden &&
					!hiddenAccounts.has(t.accountId) &&
					inWindow(t.date, window)
			);
			const accumulated = outflows.reduce((sum, t) => sum + t.amount, 0);

			result[period] = {
				total: toBar('Total', accumulated, totalLimit[period]),
				categories: categories.map((c) => {
					const catLimit = (totalLimit[period] * c.budgetPercentage) / 100;
					const catAccum = outflows
						.filter((t) => t.categoryId === c.id)
						.reduce((sum, t) => sum + t.amount, 0);
					return toBar(c.name, catAccum, catLimit);
				})
			};
		}
		return result;
	});
}
