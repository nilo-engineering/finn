import type { LayoutServerLoad } from './$types';
import { getLocale } from '$lib/paraglide/runtime';

export const load: LayoutServerLoad = ({ url }) => {
	const selectedMonth = parseMonth(url.searchParams.get('month'));
	const movement = url.searchParams.get('movement')
	const currentQuery = buildMonthQuery(currentMonth())
	const prevQuery = buildMonthQuery(addMonths(selectedMonth, -1))
	const nextQuery = buildMonthQuery(addMonths(selectedMonth, 1))

	return {
		monthNav: {
			label: label(selectedMonth),
			current: appendMovementQuery(currentQuery, movement, true),
			prev: appendMovementQuery(prevQuery, movement, false),
			next: appendMovementQuery(nextQuery, movement, false),
			movement: url.searchParams.get('movement')
		}
	};
};

type Month = { year: number; month: number };

// Fixed until per-user timezones land, so "current month" doesn't drift with the host clock.
const TZ_OFFSET_HOURS = -3;

function currentMonth(): Month {
	const local = new Date(Date.now() + TZ_OFFSET_HOURS * 60 * 60 * 1000);
	return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1 };
}

function parseMonth(param: string | null): Month {
	if (param && /^\d{4}-\d{2}$/.test(param)) {
		const [year, month] = param.split('-').map(Number);
		return { year, month };
	}
	return currentMonth();
}

function addMonths({ year, month }: Month, delta: number): Month {
	const zero = year * 12 + (month - 1) + delta;
	return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

function buildMonthQuery({ year, month }: Month): string {
	return `month=${year}-${String(month).padStart(2, '0')}`;
}

function appendMovementQuery(query: string, movement: string | null, today: boolean) {
	const movementQuery = movement ? `&movement=${movement}` : ''
	const todayAnchor = today ? '#today' : ''
	return `${query}${movementQuery}${todayAnchor}`
}

function label({ year, month }: Month): string {
	const short = new Intl.DateTimeFormat(getLocale(), { month: 'short' })
		.format(new Date(year, month - 1, 1))
		.toLowerCase();
	return `${short}/${String(year).slice(-2)}`;
}
