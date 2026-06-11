<script lang="ts">
	import { resolve } from '$app/paths';
	import Modal from '$lib/components/Modal.svelte';
	import CreateCategoryForm from '$lib/components/CreateCategoryForm.svelte';
	import EditCategoryForm from '$lib/components/EditCategoryForm.svelte';
	import { categoryList, updateBudgetPercentage } from '$lib/services/categories';
	import { accentForClasses } from '$lib/categoryColors';
	import type { CategoryView } from '$lib/services/types';

	const categoriesStore = categoryList();
	const categoriesView = $derived($categoriesStore ?? []);
	let categories = $derived(categoriesView.map((c) => ({ ...c })));
	const total = $derived(categories.reduce((sum, category) => sum + (Number(category.budgetPercentage) || 0), 0));
	let createOpen = $state(false);
	let editOpen = $state(false);
	let editing: CategoryView | null = $state(null);

	function edit(category: CategoryView) {
		editing = category;
		editOpen = true;
	}

	// Reflect the drag locally for a live value/total while the slider moves...
	function setPercentage(id: number, budgetPercentage: number) {
		categories = categories.map((r) => (r.id === id ? { ...r, budgetPercentage } : r));
	}

	function persistPercentage(id: number, budgetPercentage: number) {
		updateBudgetPercentage(id, budgetPercentage);
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Categories</h1>
		</div>

		<ul class="space-y-2">
			{#each categories as category (category.id)}
				<li class="rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
					<div class="flex items-center justify-between">
						<span class="rounded-lg px-3 py-1 text-sm font-medium {category.classes}">{category.name}</span>
						<div class="flex items-center gap-2">
							<span class="w-10 text-right text-sm font-medium text-ink/70">{category.budgetPercentage}%</span>
							<button type="button" aria-label="Edit {category.name}" onclick={() => edit(category)} class="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
									<path d="M12 20h9" />
									<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
								</svg>
							</button>
						</div>
					</div>
					<input type="range" min="0" max="100" value={category.budgetPercentage} oninput={(e) => setPercentage(category.id, e.currentTarget.valueAsNumber)} onchange={(e) => persistPercentage(category.id, e.currentTarget.valueAsNumber)} aria-label="{category.name} budget share" class="mt-3 w-full {accentForClasses(category.classes)}" />
				</li>
			{/each}
		</ul>

		{#if categories.length > 0}
			<div class="mt-4 flex items-center justify-between px-4 py-2">
				<span class="text-sm text-ink/50">Allocated</span>
				<span class="text-sm font-medium {total > 100 ? 'text-alert' : 'text-ink/70'}">{total}%</span>
			</div>
		{/if}

		<button type="button" onclick={() => (createOpen = true)} class="mt-4 w-full rounded-xl border border-dashed border-ink/20 px-4 py-3 text-sm font-medium text-ink/70 hover:border-primary hover:text-primary"> + Add category </button>
	</main>

	<Modal bind:open={createOpen}>
		<CreateCategoryForm close={() => (createOpen = false)} />
	</Modal>

	<Modal bind:open={editOpen}>
		{#key editing?.id}
			{#if editing}
				<EditCategoryForm category={editing} close={() => (editOpen = false)} />
			{/if}
		{/key}
	</Modal>
</div>
