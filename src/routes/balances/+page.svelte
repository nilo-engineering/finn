<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import inIcon from 'iconoir/icons/regular/arrow-down-left.svg?raw';
	import outIcon from 'iconoir/icons/regular/arrow-up-right.svg?raw';
	import dailyIcon from 'iconoir/icons/regular/coins-swap.svg?raw';
	import savingsIcon from 'iconoir/icons/regular/piggy-bank.svg?raw';
	import creditCardIcon from 'iconoir/icons/regular/credit-card.svg?raw';
	import MovementBottomSheet from '$lib/components/MovementBottomSheet.svelte';

	let { data } = $props();

	type DayKey = 'in' | 'out' | 'daily' | 'savings' | 'creditCard';
	type MovementMetadata = { key: DayKey; icon: string; label: string; color: string };

	const stack: MovementMetadata[] = [
		{ key: 'in', icon: inIcon, label: 'In', color: '#16a34a' },
		{ key: 'out', icon: outIcon, label: 'Out', color: '#dc2626' },
		{ key: 'daily', icon: dailyIcon, label: 'Daily', color: '#db2777' },
		{ key: 'savings', icon: savingsIcon, label: 'Savings', color: '#9fd24b' },
		{ key: 'creditCard', icon: creditCardIcon, label: 'Credit card', color: '#a855f7' }
	];

	const stateColors = {
		good: '#4ade80',
		ok: '#bbf7d0',
		alert: '#fef08a',
		danger: '#fca5a5',
		calamity: '#e05252'
	};
</script>

<div class="head">
	<span class="head-day">day</span>
	<MovementBottomSheet month={data.month} selected={data.movement} />
	<span class="head-balance">balance</span>
</div>

<ul class="days">
	{#each data.days as day, i (i)}
		{@const dayNum = i + 1}
		{@const isToday = dayNum === data.today}
		<li class="day" class:is-today={isToday} id={isToday ? 'today' : undefined}>
			<span class="date">{dayNum}</span>

			<ul class="stack">
				{#each stack as item (item.key)}
					{@const cell = day[item.key]}
					<li class="entry" class:is-zero={cell.zero} aria-label={item.label}>
						<span class="badge" style:background-color={cell.zero ? '#1a1a1a' : item.color}>
							<Icon svg={item.icon} size="0.8rem" strokeWidth={4} />
						</span>
						<span class="entry-value">{cell.display}</span>
					</li>
				{/each}
			</ul>

			<span class="balance" style:background-color={stateColors[day.state]}>{day.balance}</span>
		</li>
	{/each}
</ul>

<style>
	@reference '../layout.css';

	.days {
		@apply m-0 list-none p-0;
	}

	/* Pins directly under the app header (h-5.5rem) so the column labels stay visible while scrolling. */
	.head {
		@apply sticky z-30 flex border-b border-[#cccccc] bg-white py-2 text-lg font-semibold text-[#8a8a8a];
		top: calc(5.5rem + env(safe-area-inset-top));
	}

	.head-day {
		@apply flex w-15 shrink-0 items-center justify-center;
	}

	.head-balance {
		@apply flex flex-1 items-center justify-end px-4 pl-6;
	}

	.day {
		@apply flex border-b border-[#cccccc];
	}

	.is-today {
		@apply border-y border-current;
		/* Clear the app header plus the sticky column header when jumping to #today. */
		scroll-margin-top: calc(5.5rem + 2.5rem + env(safe-area-inset-top));
	}

	.date {
		@apply flex w-15 shrink-0 items-start justify-center text-lg tabular-nums;
	}

	.is-today .date {
		@apply bg-[#1a1a1a] text-white;
	}

	.stack {
		@apply m-0 flex w-50 list-none flex-col justify-center divide-y divide-[#cccccc] border-l border-[#cccccc];
	}

	.entry {
		@apply flex items-center gap-2 px-4 py-4 text-lg leading-none;
	}

	.is-zero {
		@apply opacity-20;
	}

	.badge {
		@apply flex size-6 shrink-0 items-center justify-center rounded-full text-white;
	}

	.entry-value {
		@apply ml-auto tabular-nums;
	}

	.balance {
		@apply flex flex-1 items-start justify-end p-4 pl-6 text-lg leading-none tabular-nums;
	}
</style>
