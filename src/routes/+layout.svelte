<script lang="ts">
	import { onMount } from 'svelte';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { startSync } from '$lib/sync';
	import './layout.css';

	let { children, data } = $props();

	onMount(() => {
		if (data.authenticated) startSync();
	});
</script>

<svelte:head><title>Finn</title></svelte:head>
{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
