<script lang="ts">
	import { untrack } from 'svelte';
	import { renameCategory, removeCategory } from '$lib/services/categories';
	import { CATEGORY_COLORS } from '$lib/categoryColors';
	import type { CategoryView } from '$lib/services/types';

	type Props = {
		category: CategoryView;
		close: () => void;
	};

	let { category, close }: Props = $props();

	// Seeded once on mount; the parent remounts this form (via `{#key}`) when a
	// different category is opened, so this one-time snapshot is intentional.
	let name = $state(untrack(() => category.name));
	let classes = $state(untrack(() => category.classes));
	let error = $state('');

	async function save(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			error = 'Please enter a name.';
			return;
		}
		try {
			await renameCategory(category.id, trimmed, classes);
			close();
		} catch (e) {
			if (e instanceof Error && e.name === 'ConstraintError') {
				error = 'A category with that name already exists.';
			} else {
				error = 'Could not save the category.';
			}
		}
	}

	async function remove() {
		await removeCategory(category.id);
		close();
	}
</script>

<form class="flex flex-col gap-5 rounded-2xl bg-white p-6 text-ink shadow-xl" onsubmit={save}>
	<h2 class="text-lg font-semibold text-primary-deep">Edit category</h2>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ink/60">Name</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input type="text" bind:value={name} autofocus placeholder="e.g. Travel" class="rounded-xl border border-ink/15 px-3 py-2 text-base outline-none focus:border-primary" />
	</label>

	<div class="flex flex-col gap-2">
		<span class="text-sm text-ink/60">Color</span>
		<div class="flex gap-2">
			{#each CATEGORY_COLORS as color (color.classes)}
				<button type="button" aria-label={color.label} aria-pressed={classes === color.classes} onclick={() => (classes = color.classes)} class="h-9 w-9 rounded-full {color.classes} {classes === color.classes ? 'ring-2 ring-ink ring-offset-2' : ''}"></button>
			{/each}
		</div>
	</div>

	{#if error}
		<p class="text-sm text-alert">{error}</p>
	{/if}

	<div class="flex items-center justify-between gap-3 pt-1">
		{#if category.txCount > 0}
			<span class="text-xs text-ink/40">Used by {category.txCount} transactions</span>
		{:else}
			<button type="button" onclick={remove} class="text-sm font-medium text-alert hover:underline"> Delete </button>
		{/if}

		<div class="flex items-center gap-2">
			<button type="button" onclick={close} class="rounded-xl px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"> Cancel </button>
			<button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95"> Save </button>
		</div>
	</div>
</form>
