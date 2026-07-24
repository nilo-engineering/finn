<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';

	let { children } = $props();

	// Bidirectional: slides up from the bottom on enter, back down on leave. SvelteKit
	// plays the outro during client navigation, revealing the destination underneath.
	function slide(_node: Element, { duration = 300 } = {}): TransitionConfig {
		return {
			duration,
			easing: cubicOut,
			css: (t) => `transform: translateY(${(1 - t) * 100}%)`
		};
	}
</script>

<div class="screen" transition:slide>
	{@render children()}
</div>

<style>
	@reference '../layout.css';

	.screen {
		@apply fixed inset-0 z-40 overflow-y-auto bg-white;
	}
</style>
