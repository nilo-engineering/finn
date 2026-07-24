<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from './Icon.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import plusIcon from 'iconoir/icons/plus.svg?raw';
	import inIcon from 'iconoir/icons/regular/arrow-down-left.svg?raw';
	import outIcon from 'iconoir/icons/regular/arrow-up-right.svg?raw';
	import dailyIcon from 'iconoir/icons/regular/coins-swap.svg?raw';
	import savingsIcon from 'iconoir/icons/regular/piggy-bank.svg?raw';
	import creditCardIcon from 'iconoir/icons/regular/credit-card.svg?raw';

	const id = 'add-sheet';

	const options = [
		{
			title: 'in',
			description: 'salary, commission, bonus',
			href: resolve('/movements/new?type=in'),
			asset: { icon: inIcon, backgroundColor: '#16a34a', color: 'white' }
		},
		{
			title: 'out',
			description: 'fixed expenses, bills, rent',
			href: resolve('/movements/new?type=out'),
			asset: { icon: outIcon, backgroundColor: '#dc2626', color: 'white' }
		},
		{
			title: 'daily',
			description: 'variable expenses, shopping',
			href: resolve('/movements/new?type=daily'),
			asset: { icon: dailyIcon, backgroundColor: '#db2777', color: 'white' }
		},
		{
			title: 'savings',
			description: 'investment, emergency reserve',
			href: resolve('/movements/new?type=savings'),
			asset: { icon: savingsIcon, backgroundColor: '#9fd24b', color: 'white' }
		},
		{
			title: 'credit card',
			description: 'expenses or total credit card bill',
			href: resolve('/movements/new?type=creditCard'),
			asset: { icon: creditCardIcon, backgroundColor: '#a855f7', color: 'white' }
		}
	];
</script>

<button class="fab" type="button" aria-label="Add" command="show-modal" commandfor={id}>
	<Icon svg={plusIcon} size="1.75rem" />
</button>

<BottomSheet {id} title="add" {options} />

<style>
	@reference '../../routes/layout.css';

	.fab {
		@apply flex size-12 cursor-pointer items-center justify-center rounded-full border-none bg-[#111] text-white;
	}
</style>
