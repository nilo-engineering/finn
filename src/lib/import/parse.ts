import type { Transaction } from '$lib/db/types';
import type { ImportProfile } from './types';
import { profiles } from './profiles';
import type { CsvRecord } from './csv';

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export interface RowError {
	row: number; // 1-based line number within the file
	reason: string;
	raw: string;
}

export interface ParseResult {
	txs: NewTransaction[];
	errors: RowError[];
}

// Match a file's header row against the registry. Signatures are distinct across
// all profiles, so this is unambiguous. Returns null -> caller falls back to a
// manual profile pick.
export function detectProfile(header: string[]): ImportProfile | null {
	return (
		profiles.find(
			(p) =>
				p.signature.length === header.length && p.signature.every((col) => header.includes(col))
		) ?? null
	);
}

// Parse a date (and optional time) per the profile's format into ISO date + 'HH:mm'.
// Time defaults to '00:00' when the source value has no time component.
export function parseDateTime(raw: string, format: string): { date: string; time: string } {
	const [datePart, timePart] = raw.trim().split(/\s+/);
	const fmt = format.split(/[-/]/);
	const vals = (datePart ?? '').split(/[-/]/);
	if (vals.length !== 3) throw new Error(`Unrecognized date "${raw}"`);

	const pick = (token: string) => vals[fmt.findIndex((t) => t.startsWith(token))];
	const year = pick('Y');
	const month = pick('M');
	const day = pick('D');
	if (!year || !month || !day) throw new Error(`Unrecognized date "${raw}"`);

	const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

	let time = '00:00';
	if (timePart) {
		const [h, m] = timePart.split(':');
		time = `${(h ?? '0').padStart(2, '0')}:${(m ?? '0').padStart(2, '0')}`;
	}
	return { date, time };
}

// Parse a possibly-signed amount, stripping a thousands separator and normalizing
// the decimal separator to a dot.
export function parseAmount(
	raw: string,
	opts: { decimalSeparator: string; thousandsSeparator?: string }
): number {
	const negative = raw.includes('-');
	let s = raw;
	if (opts.thousandsSeparator) s = s.split(opts.thousandsSeparator).join('');
	if (opts.decimalSeparator !== '.') s = s.split(opts.decimalSeparator).join('.');
	s = s.replace(/[^0-9.]/g, '');
	const n = Number.parseFloat(s);
	if (Number.isNaN(n)) throw new Error(`Unrecognized amount "${raw}"`);
	return negative ? -n : n;
}

// Turn CSV records (header + data) into ready-to-insert transactions for one
// profile. Per-row failures are collected as errors instead of aborting the batch.
// Throws only when the header lacks the columns the profile expects (wrong profile).
export function recordsToTransactions(
	records: CsvRecord[],
	profile: ImportProfile,
	accountId: number
): ParseResult {
	const header = records[0]?.fields ?? [];
	const indexOf = (name: string) => {
		const i = header.indexOf(name);
		if (i === -1) throw new Error(`Column "${name}" not found in file header`);
		return i;
	};

	const dateIdx = indexOf(profile.columns.date);
	const titleIdx = indexOf(profile.columns.title);
	const amountIdx = indexOf(profile.columns.amount);
	const descIdx = profile.columns.description ? indexOf(profile.columns.description) : -1;
	const skipRules = (profile.skipWhen ?? []).map((r) => ({
		idx: indexOf(r.column),
		equals: r.equals
	}));

	const txs: NewTransaction[] = [];
	const errors: RowError[] = [];

	records.slice(1).forEach((record, i) => {
		const { fields, raw } = record;
		const rowNum = i + 2; // +1 for header, +1 for 1-based

		if (skipRules.some((r) => (fields[r.idx] ?? '') === r.equals)) return;

		try {
			const { date, time } = parseDateTime(fields[dateIdx], profile.dateFormat);
			const signed = parseAmount(fields[amountIdx], {
				decimalSeparator: profile.decimalSeparator,
				thousandsSeparator: profile.thousandsSeparator
			});
			const isOut = profile.outflowSign === '+' ? signed > 0 : signed < 0;
			const direction = isOut ? 'out' : 'in';

			txs.push({
				direction,
				amount: Math.abs(signed),
				title: fields[titleIdx] ?? '',
				description: descIdx >= 0 ? (fields[descIdx] ?? '') : '',
				date,
				time,
				accountId,
				categoryId: null,
				method: profile.method,
				status: direction === 'out' ? 'pending' : 'reviewed',
				sourceRow: raw
			});
		} catch (e) {
			errors.push({ row: rowNum, reason: e instanceof Error ? e.message : String(e), raw });
		}
	});

	return { txs, errors };
}
