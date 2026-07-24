import type { PageServerLoad } from './$types';

// Placeholder data until the transaction/query layer lands. Shape mirrors what the
// real aggregation will return so the page and its markup stay unchanged.
export const load: PageServerLoad = ({ url }) => {
	const viewed = parseMonth(url.searchParams.get('month'));
	const movement = url.searchParams.get('movement') ?? 'all';
	const now = currentMonth();
	const daysInMonth = new Date(viewed.year, viewed.month, 0).getDate();

	// Only mark "today" when the viewed month is the current one.
	const today = viewed.year === now.year && viewed.month === now.month ? currentDay() : null;

	let balance = 900;
	const days = Array.from({ length: daysInMonth }, (_, i) => {
		const d = i + 1;
		const inc = d % 6 === 0 ? 2200 : 0;
		// One-off large expenses so the running balance visits calamity (< -500),
		// danger (< 0) and alert (< 500) before income recovers it — exercises every state.
		const bigOut = d === 3 ? 1700 : d === 22 ? 3850 : d === 10 ? 400 : 0;
		const out = bigOut || (d % 10 === 0 ? 300 : 0);
		const daily = ((d * 37) % 50) + 15;
		const savings = d % 7 === 0 ? 150 : 0;
		const creditCard = d % 4 === 0 ? (d * 13) % 200 : 0;
		balance += inc - out - daily - savings - creditCard;
		return {
			in: mov(inc),
			out: mov(out),
			daily: mov(daily),
			savings: mov(savings),
			creditCard: mov(creditCard),
			balance: money(balance),
			state: state(balance),
			today: d === today
		};
	});

	return { month: fmt(viewed), today, days, movement };
};

// A movement cell carries its own zero flag so the UI can de-emphasize empty categories
// without re-parsing the formatted string.
function mov(n: number): { display: string; zero: boolean } {
	return { display: money(n), zero: n === 0 };
}

function money(n: number): string {
	return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type State = 'good' | 'ok' | 'alert' | 'danger' | 'calamity';

// Stub thresholds off the running balance so states vary across the month.
function state(balance: number): State {
	if (balance < -500) return 'calamity';
	if (balance < 0) return 'danger';
	if (balance < 1000) return 'alert';
	if (balance < 2000) return 'ok';
	return 'good';
}

type Month = { year: number; month: number };

// Fixed until per-user timezones land, so "current month" doesn't drift with the host clock.
const TZ_OFFSET_HOURS = -3;

function localNow(): Date {
	return new Date(Date.now() + TZ_OFFSET_HOURS * 60 * 60 * 1000);
}

function currentMonth(): Month {
	const local = localNow();
	return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1 };
}

function currentDay(): number {
	return localNow().getUTCDate();
}

function parseMonth(param: string | null): Month {
	if (param && /^\d{4}-\d{2}$/.test(param)) {
		const [year, month] = param.split('-').map(Number);
		return { year, month };
	}
	return currentMonth();
}

function fmt({ year, month }: Month): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}
