<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toast } from '$lib/utils/toast.svelte';
</script>

{#if toast.message}
	<div class="toast" role="status" transition:fly={{ y: 24, duration: 200 }}>
		{toast.message}
	</div>
{/if}

<style>
	@reference '../../routes/layout.css';

	.toast {
		@apply fixed inset-x-0 z-60 mx-auto w-fit max-w-[90%] rounded-full bg-[#1a1a1a] px-5 py-3 text-center leading-none font-semibold text-white;
		bottom: calc(1.5rem + env(safe-area-inset-bottom));
	}
</style>
