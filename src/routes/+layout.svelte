<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head><title>Finn</title></svelte:head>

<main class="app-main">
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
