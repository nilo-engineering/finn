<script lang="ts">
	type Props = {
		src: string;
		class?: string;
	};
	
	let { src, class: className = 'h-5 w-5' }: Props = $props();
	/* eslint-disable svelte/no-at-html-tags */
</script>

<span class="inline-flex {className} [&>svg]:h-full [&>svg]:w-full" aria-hidden="true">{@html src}</span>
