<script lang="ts">
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
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-5 w-5"
		aria-hidden="true"
	>
		<line x1="12" y1="6" x2="12" y2="13" />
		<circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
	</svg>
</button>
