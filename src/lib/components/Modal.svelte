<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		children: Snippet;
		// Override the dialog's sizing/box classes (e.g. a wider modal for JSON).
		class?: string;
	};

	let { open = $bindable(), children, class: className = 'w-[min(90vw,360px)]' }: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			open = false;
		}
	}

	function onClose() {
		open = false;
	}
</script>

<dialog bind:this={dialogEl} onclose={onClose} onclick={onBackdropClick} class="m-auto overflow-visible bg-transparent p-0 backdrop:bg-black/40 {className}">
	<!-- Mounted only while open so the form inside resets between openings. -->
	{#if open}
		{@render children()}
	{/if}
</dialog>
