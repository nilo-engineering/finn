<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Header from '$lib/components/Header.svelte';
	import MonthNav from '$lib/components/MonthNav.svelte';
	import './layout.css';

	let { children, data } = $props();

	const headerHeight = '5rem';
</script>

<svelte:head><title>Finn</title></svelte:head>

<Header height={headerHeight}>
	<MonthNav {...data.monthNav} />
</Header>

<main class="app-main" style:--header-h={headerHeight}>
	{@render children()}
</main>

<BottomNav />

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>

<style>
	@reference './layout.css';

	/* Keep page content clear of the fixed bottom nav (h-20) + safe area. */
	.app-main {
		@apply pb-[calc(5rem+env(safe-area-inset-bottom))];
	}
</style>
