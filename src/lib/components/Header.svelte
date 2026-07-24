<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<header class="header">
	{@render children()}
</header>

<style>
	@reference '../../routes/layout.css';

	.header {
		@apply sticky top-0 z-40 flex items-center justify-between border-b border-[#cccccc] bg-white px-6;
		padding-top: env(safe-area-inset-top);
		height: calc(5rem + env(safe-area-inset-top));
	}
</style>
