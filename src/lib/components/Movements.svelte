<script lang="ts">
	import Icon from './Icon.svelte';
	import inIcon from 'iconoir/icons/regular/arrow-down-left.svg?raw';
	import outIcon from 'iconoir/icons/regular/arrow-up-right.svg?raw';
	import dailyIcon from 'iconoir/icons/regular/coins-swap.svg?raw';
	import savingsIcon from 'iconoir/icons/regular/piggy-bank.svg?raw';
	import creditCardIcon from 'iconoir/icons/regular/credit-card.svg?raw';

	type DayKey = 'in' | 'out' | 'daily' | 'savings' | 'creditCard';
	type Cell = { display: string; zero: boolean };

	interface Props {
		/** The day's movement cells, keyed by category. */
		day: Record<DayKey, Cell>;
		/** Selected movement value from the loader; `'all'` shows every category. */
		movement: string;
	}

	let { day, movement }: Props = $props();

	const shows = (value: string) => movement === 'all' || movement === value;
</script>

{#snippet entry(cell: Cell, icon: string, label: string, color: string)}
	<li class="entry" class:is-zero={cell.zero} aria-label={label}>
		<span class="badge" style:background-color={cell.zero ? '#1a1a1a' : color}>
			<Icon svg={icon} size="0.8rem" strokeWidth={4} />
		</span>
		<span class="entry-value">{cell.display}</span>
	</li>
{/snippet}

<ul class="stack">
	{#if shows('in')}
		{@render entry(day.in, inIcon, 'In', '#16a34a')}
	{/if}
	{#if shows('out')}
		{@render entry(day.out, outIcon, 'Out', '#dc2626')}
	{/if}
	{#if shows('daily')}
		{@render entry(day.daily, dailyIcon, 'Daily', '#db2777')}
	{/if}
	{#if shows('savings')}
		{@render entry(day.savings, savingsIcon, 'Savings', '#9fd24b')}
	{/if}
	{#if shows('creditCard')}
		{@render entry(day.creditCard, creditCardIcon, 'Credit card', '#a855f7')}
	{/if}
</ul>

<style>
	@reference '../../routes/layout.css';

	.stack {
		@apply m-0 flex w-45 list-none flex-col justify-center divide-y divide-[#cccccc] border-l border-[#cccccc];
	}

	.entry {
		@apply flex items-center gap-2 p-3 text-lg leading-none;
	}

	.is-zero .badge,
	.is-zero .entry-value {
		@apply opacity-20;
	}

	.badge {
		@apply flex size-6 shrink-0 items-center justify-center rounded-full text-white;
	}

	.entry-value {
		@apply ml-auto tabular-nums;
	}
</style>
