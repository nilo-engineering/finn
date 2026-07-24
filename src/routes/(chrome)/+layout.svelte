<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Header from '$lib/components/Header.svelte';
	import MonthNav from '$lib/components/MonthNav.svelte';

	let { children, data } = $props();

	const headerHeight = '5rem';
</script>

<Header height={headerHeight}>
	<MonthNav {...data.monthNav} />
</Header>

<main class="app-main" style:--header-h={headerHeight}>
	{@render children()}
</main>

<BottomNav />

<style>
	@reference '../layout.css';

	/* Keep page content clear of the fixed bottom nav (h-20) + safe area. */
	.app-main {
		@apply pb-[calc(5rem+env(safe-area-inset-bottom))];
	}
</style>
