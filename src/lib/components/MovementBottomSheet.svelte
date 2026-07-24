<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from './Icon.svelte';
	import Badge from './Badge.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import inIcon from 'iconoir/icons/regular/arrow-down-left.svg?raw';
	import outIcon from 'iconoir/icons/regular/arrow-up-right.svg?raw';
	import dailyIcon from 'iconoir/icons/regular/coins-swap.svg?raw';
	import savingsIcon from 'iconoir/icons/regular/piggy-bank.svg?raw';
	import creditCardIcon from 'iconoir/icons/regular/credit-card.svg?raw';
	import listIcon from 'iconoir/icons/regular/list.svg?raw';
	import chevronIcon from 'iconoir/icons/regular/nav-arrow-down.svg?raw';

	interface Props {
		/** Current month (`YYYY-MM`), preserved in each option's href. */
		month: string;
		/** Currently selected movement value. */
		selected: string;
	}

	let { month, selected }: Props = $props();

	const id = 'movement-sheet';

	const options = $derived([
		{
			value: 'in',
			title: 'in',
			href: resolve(`/balances?month=${month}&movement=in`),
			asset: { icon: inIcon, backgroundColor: '#16a34a', color: 'white' }
		},
		{
			value: 'out',
			title: 'out',
			href: resolve(`/balances?month=${month}&movement=out`),
			asset: { icon: outIcon, backgroundColor: '#dc2626', color: 'white' }
		},
		{
			value: 'daily',
			title: 'daily',
			href: resolve(`/balances?month=${month}&movement=daily`),
			asset: { icon: dailyIcon, backgroundColor: '#db2777', color: 'white' }
		},
		{
			value: 'savings',
			title: 'savings',
			href: resolve(`/balances?month=${month}&movement=savings`),
			asset: { icon: savingsIcon, backgroundColor: '#9fd24b', color: 'white' }
		},
		{
			value: 'creditCard',
			title: 'credit card',
			href: resolve(`/balances?month=${month}&movement=creditCard`),
			asset: { icon: creditCardIcon, backgroundColor: '#a855f7', color: 'white' }
		},
		{
			value: 'all',
			title: 'all',
			href: resolve(`/balances?month=${month}&movement=all`),
			asset: { icon: listIcon, backgroundColor: 'transparent', color: '#1a1a1a' }
		}
	]);

	const selectedOption = $derived(options.find((option) => option.value === selected));
</script>

<button type="button" command="show-modal" commandfor={id}>
	{#if selectedOption}
		<Badge {...selectedOption.asset} />
	{/if}
	<span>{selectedOption?.title ?? selected}</span>
	<Icon svg={chevronIcon} size="1.25rem" />
</button>

<BottomSheet {id} title="show" {options} />

<style>
	@reference '../../routes/layout.css';

	button {
		@apply flex w-42 cursor-pointer items-center gap-1 rounded-full border-2 border-[#cccccc] bg-white px-2 py-1 leading-none font-semibold text-[#8a8a8a];
	}

	span {
		@apply mr-auto min-w-0 truncate leading-6;
	}
</style>
