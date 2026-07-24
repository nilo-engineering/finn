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
			<span class="date" class:is-weekend={day.weekend}>{i + 1}</span>
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

	.head {
		@apply sticky z-30 flex border-b border-[#cccccc] bg-white py-2 text-lg font-semibold text-[#8a8a8a];
		top: calc(5rem + env(safe-area-inset-top) - 1px);
	}

	.head-day {
		@apply flex w-15 shrink-0 items-center justify-center;
	}

	.head-balance {
		@apply flex flex-1 items-center justify-end px-4 pl-6;
	}

	.day {
		@apply flex border-b border-[#999999];
	}

	.is-today {
		@apply border-b border-current;
		/* Clear the app header (5rem) plus the sticky column header (~3.5rem, sized by its Movement filter button) when jumping to #today. */
		scroll-margin-top: calc(5rem + 3.5rem + env(safe-area-inset-top));
	}

	.date {
		@apply flex w-12 shrink-0 items-start justify-center text-lg tabular-nums leading-none pt-3;
	}

	.date.is-weekend {
		@apply bg-[#f2f2f2];
	}

	.is-today .date {
		@apply bg-[#1a1a1a] text-white;
	}

	.balance {
		@apply flex flex-1 items-start justify-end p-3 text-lg leading-none tabular-nums;
	}
</style>
