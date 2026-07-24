<script lang="ts">
	import MovementBottomSheet from '$lib/components/MovementBottomSheet.svelte';
	import Movements from '$lib/components/Movements.svelte';

	let { data } = $props();

	const balanceColors = {
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
		<li class="day" class:is-today={day.today} id={day.today ? 'today' : undefined}>
			<span class="date">{i + 1}</span>
			<Movements {day} movement={data.movement} />
			<span class="balance" style:background-color={balanceColors[day.state]}>{day.balance}</span>
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

	.balance {
		@apply flex flex-1 items-start justify-end p-4 pl-6 text-lg leading-none tabular-nums;
	}
</style>
