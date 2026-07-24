<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import Toast from '$lib/components/Toast.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head><title>Finn</title></svelte:head>

{@render children()}

<Toast />

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
