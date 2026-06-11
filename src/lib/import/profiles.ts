import type { ImportProfile } from './types';

// The registry of supported bank CSV layouts. Add an entry here to onboard a new
// bank/type — no other file needs to change. Both NuBank profiles resolve to the
// account named 'NuBank', both BTG to 'BTG'; `method` distinguishes credit/debit.
export const profiles: ImportProfile[] = [
	{
		id: 'nubank-credito',
		label: 'NuBank · Credit',
		accountName: 'NuBank',
		method: 'Credit',
		delimiter: ',',
		signature: ['date', 'title', 'amount'],
		columns: { date: 'date', title: 'title', amount: 'amount' },
		dateFormat: 'YYYY-MM-DD',
		decimalSeparator: '.',
		outflowSign: '+'
	},
	{
		id: 'nubank-debito',
		label: 'NuBank · Debit',
		accountName: 'NuBank',
		method: 'Debit',
		delimiter: ',',
		signature: ['Data', 'Valor', 'Identificador', 'Descrição'],
		columns: { date: 'Data', title: 'Descrição', amount: 'Valor' }, // Identificador (UUID) ignored
		dateFormat: 'DD/MM/YYYY',
		decimalSeparator: '.',
		outflowSign: '-'
	},
	{
		id: 'btg-credito',
		label: 'BTG · Credit',
		accountName: 'BTG',
		method: 'Credit',
		delimiter: ',',
		signature: [
			'Data',
			'Descrição',
			'Valor',
			'Tipo de compra',
			'Código de autorização',
			'Final Cartão'
		],
		columns: { date: 'Data', title: 'Descrição', amount: 'Valor' },
		dateFormat: 'MM/DD/YYYY', // US date order
		decimalSeparator: '.',
		outflowSign: '+'
	},
	{
		id: 'btg-debito',
		label: 'BTG · Debit',
		accountName: 'BTG',
		method: 'Debit',
		delimiter: ',',
		signature: ['Data e hora', 'Categoria', 'Transação', 'Descrição', 'Valor'],
		columns: { date: 'Data e hora', title: 'Transação', description: 'Descrição', amount: 'Valor' },
		dateFormat: 'DD/MM/YYYY',
		decimalSeparator: '.',
		thousandsSeparator: ',',
		outflowSign: '-',
		skipWhen: [{ column: 'Transação', equals: '' }] // drops "Saldo Diário" balance lines
	}
];

export function profileById(id: string): ImportProfile | undefined {
	return profiles.find((p) => p.id === id);
}
