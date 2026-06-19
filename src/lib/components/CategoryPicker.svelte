<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { CategoryOption } from '$lib/services/types';
	import navArrowDown from 'iconoir/icons/nav-arrow-down.svg?raw';
	import check from 'iconoir/icons/check.svg?raw';

	type Props = {
		categories: CategoryOption[];
		selectedId: string | null;
		onSelect: (categoryId: string | null) => void;
	};

	let { categories, selectedId, onSelect }: Props = $props();

	let open = $state(false);

	const selected = $derived(categories.find((c) => c.id === selectedId));

	function choose(categoryId: string | null) {
		open = false;
		onSelect(categoryId);
	}
</script>

<div class="relative inline-block">
	<button
		type="button"
		onclick={() => (open = !open)}
		class="-my-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium transition-colors {selected
			? selected.classes
			: 'bg-ink/5 text-ink/60 hover:bg-ink/10'}"
	>
		{selected ? selected.name : 'Uncategorized'}
		<Icon src={navArrowDown} class="h-3 w-3 opacity-60" />
	</button>

	{#if open}
		<!-- Closes on outside click; sits above sibling rows so it also swallows a click
		     onto another row's picker, keeping only one open at a time. -->
		<button
			type="button"
			aria-label="Close category menu"
			onclick={() => (open = false)}
			class="fixed inset-0 z-40 cursor-default"
		></button>
		<div
			class="absolute left-0 z-50 mt-1 flex min-w-40 flex-col gap-1 rounded-xl border border-ink/10 bg-white p-1.5 shadow-xl"
		>
			{#each categories as cat (cat.id)}
				<button
					type="button"
					onclick={() => choose(cat.id)}
					class="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition-transform hover:scale-[1.02] {cat.classes}"
				>
					{cat.name}
					{#if cat.id === selectedId}
						<Icon src={check} class="h-3.5 w-3.5" />
					{/if}
				</button>
			{/each}
			<button
				type="button"
				onclick={() => choose(null)}
				class="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5"
			>
				Uncategorized
				{#if selectedId === null}
					<Icon src={check} class="h-3.5 w-3.5" />
				{/if}
			</button>
		</div>
	{/if}
</div>
