// Shared formatters. The single place where money and dates become display strings.

const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const wholeMoneyFmt = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});
const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export function money(n: number) {
	return moneyFmt.format(n); // "$6.50"
}

export function wholeMoney(n: number) {
	return wholeMoneyFmt.format(n); // "$7,200"
}

export function formatDate(iso: string) {
	// Parse as a local date; `new Date('YYYY-MM-DD')` would treat it as UTC
	// midnight and render the previous day in negative-UTC timezones.
	const [year, month, day] = iso.split('-').map(Number);
	return dateFmt.format(new Date(year, month - 1, day)); // "Jun 6, 2026"
}
