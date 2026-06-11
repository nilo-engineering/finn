// A declarative description of one bank's CSV export layout. Each (account, type)
// combination gets its own profile; one generic parser consumes them all.
export interface ImportProfile {
	id: string; // 'nubank-credito'
	label: string; // 'NuBank · Credit' (shown in the manual-fallback picker)
	accountName: string; // resolved (trim + case-insensitive) -> accountId at import
	method: string; // 'Credit' | 'Debit' (stored on the transaction)
	delimiter: string; // ',' for all current formats
	signature: string[]; // exact (normalized) header columns, used for auto-detection
	columns: {
		date: string;
		title: string;
		description?: string;
		amount: string;
	}; // by header name
	dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'; // trailing time component is captured separately
	decimalSeparator: '.' | ',';
	thousandsSeparator?: ',' | '.' | ''; // stripped before parsing (btg-debito uses ',')
	outflowSign: '+' | '-'; // which sign of `amount` means money OUT
	skipWhen?: { column: string; equals: string }[]; // drop non-transaction rows (balance lines)
}
