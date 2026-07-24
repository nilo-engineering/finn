import inIcon from 'iconoir/icons/regular/arrow-down-left.svg?raw';
import outIcon from 'iconoir/icons/regular/arrow-up-right.svg?raw';
import dailyIcon from 'iconoir/icons/regular/coins-swap.svg?raw';
import savingsIcon from 'iconoir/icons/regular/piggy-bank.svg?raw';
import creditCardIcon from 'iconoir/icons/regular/credit-card.svg?raw';

export type MovementType = 'in' | 'out' | 'daily' | 'savings' | 'creditCard';

export interface MovementTypeMeta {
	key: MovementType;
	/** Human label used in headers, buttons and pickers. */
	label: string;
	/** Secondary line shown under the label in pickers. */
	description: string;
	/** Circle/fill color for badges and the submit button. */
	color: string;
	/** Raw iconoir SVG markup. */
	icon: string;
}

export const MOVEMENT_TYPES: MovementTypeMeta[] = [
	{
		key: 'in',
		label: 'in',
		description: 'salary, commission, bonus',
		color: '#16a34a',
		icon: inIcon
	},
	{
		key: 'out',
		label: 'out',
		description: 'fixed expenses, bills, rent',
		color: '#dc2626',
		icon: outIcon
	},
	{
		key: 'daily',
		label: 'daily',
		description: 'variable expenses, shopping',
		color: '#db2777',
		icon: dailyIcon
	},
	{
		key: 'savings',
		label: 'savings',
		description: 'investment, emergency reserve',
		color: '#9fd24b',
		icon: savingsIcon
	},
	{
		key: 'creditCard',
		label: 'credit card',
		description: 'expenses or total credit card bill',
		color: '#a855f7',
		icon: creditCardIcon
	}
];

export function movementType(key: string | null | undefined): MovementTypeMeta | undefined {
	return MOVEMENT_TYPES.find((t) => t.key === key);
}
