<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import bell from 'iconoir/icons/bell.svg?raw';

	type Props = {
		onclick?: () => void;
	};

	let { onclick }: Props = $props();
</script>

<button
	type="button"
	aria-label="Review pending expense"
	{onclick}
	class="fixed top-1/2 right-4 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-alert text-white shadow-md transition-transform duration-150 hover:scale-105 active:scale-95"
>
	<Icon src={bell} class="h-5 w-5" />
</button>
