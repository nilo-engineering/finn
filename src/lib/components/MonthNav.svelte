<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from './Icon.svelte';
	import calendarIcon from '$lib/assets/calendar-mark.svg';
	import leftIcon from 'iconoir/icons/nav-arrow-left.svg?raw';
	import rightIcon from 'iconoir/icons/nav-arrow-right.svg?raw';
	import overviewIcon from '$lib/assets/widget.svg';

	let {
		label,
		current,
		prev,
		next,
		movement
	}: { label: string; current: string; prev: string; next: string; movement: string | null } =
		$props();

	// Preserve the selected movement filter when navigating between months.
	const movementQuery = $derived(movement ? `&movement=${movement}` : '');
</script>

<a
	class="icon-link"
	href={resolve(`/balances?month=${current}${movementQuery}#today`)}
	aria-label="Go to current month"
>
	<img class="calendar-icon" src={calendarIcon} alt="" />
</a>

<div class="pager">
	<a class="icon-link" href={resolve(`/balances?month=${prev}${movementQuery}`)} aria-label="Previous month">
		<Icon svg={leftIcon} />
	</a>

	<a class="month" href={resolve(`/balances?month=${current}${movementQuery}`)}>{label}</a>

	<a class="icon-link" href={resolve(`/balances?month=${next}${movementQuery}`)} aria-label="Next month">
		<Icon svg={rightIcon} />
	</a>
</div>

<a class="icon-link" href={resolve('/balances-overview')} aria-label="Balances overview">
	<img class="overview-icon" src={overviewIcon} alt="" />
</a>

<style>
	@reference '../../routes/layout.css';

	.pager {
		@apply flex items-center gap-8;
	}

	.icon-link {
		@apply flex items-center justify-center no-underline;
	}

	.calendar-icon {
		@apply size-9;
	}

	.overview-icon {
		@apply size-9;
	}

	.month {
		@apply min-w-16 text-center text-2xl font-semibold no-underline;
	}
</style>
