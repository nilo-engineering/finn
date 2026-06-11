<script lang="ts">
	import { resolve } from '$app/paths';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Wheel from '$lib/components/Wheel.svelte';
	import AlertButton from '$lib/components/AlertButton.svelte';
	import ExpenseModal from '$lib/components/ExpenseModal.svelte';
	import { budgetBars, periodOptions } from '$lib/services/dashboard';

	let selected = $state('Year');
	let modalOpen = $state(false);
	const bars = budgetBars();
	const view = $derived($bars?.[selected]);
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-semibold text-primary-deep">Finn</h1>
			<a href={resolve('/accounts')} aria-label="Manage accounts" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
				</svg>
			</a>
		</div>

		{#if view}
			<ProgressBar primaryLabel={view.total.primaryLabel} secondaryLabel={view.total.secondaryLabel} percentage={view.total.percentage} />

			<ul class="mt-8 space-y-6 border-t border-ink/10 pt-6">
				{#each view.categories as budget (budget.primaryLabel)}
					<li>
						<ProgressBar primaryLabel={budget.primaryLabel} secondaryLabel={budget.secondaryLabel} percentage={budget.percentage} />
					</li>
				{/each}
			</ul>
		{/if}
	</main>

	<nav class="sticky bottom-0 p-4">
		<Wheel options={periodOptions} bind:value={selected} />
	</nav>

	<AlertButton onclick={() => (modalOpen = true)} />
	<ExpenseModal bind:open={modalOpen} />
</div>
