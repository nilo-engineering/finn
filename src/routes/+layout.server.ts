import type { LayoutServerLoad } from './$types';
import { getLocale } from '$lib/paraglide/runtime';

export const load: LayoutServerLoad = ({ url }) => {
	const viewed = parseMonth(url.searchParams.get('month'));
	return {
		monthNav: {
			label: label(viewed),
			current: fmt(currentMonth()),
			prev: fmt(addMonths(viewed, -1)),
			next: fmt(addMonths(viewed, 1)),
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

function fmt({ year, month }: Month): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}

function label({ year, month }: Month): string {
	const short = new Intl.DateTimeFormat(getLocale(), { month: 'short' })
		.format(new Date(year, month - 1, 1))
		.toLowerCase();
	return `${short}/${String(year).slice(-2)}`;
}
