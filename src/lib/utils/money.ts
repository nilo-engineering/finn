/** Format a number as the app's `$ 1,234.00` currency string. */
export function formatMoney(n: number): string {
	return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Parse a user-entered currency string into a number, tolerating the `$` prefix,
 * thousands separators and surrounding whitespace. Returns `NaN` when the input
 * holds no parseable number so callers can validate.
 */
export function parseMoney(input: string): number {
	const cleaned = input.replace(/[^0-9.-]/g, '');
	if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
	return Number(cleaned);
}
