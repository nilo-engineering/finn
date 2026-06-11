<script lang="ts">
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
		<h1 class="mb-8 text-2xl font-semibold text-primary-deep">Finn</h1>

		{#if view}
			<ProgressBar
				primaryLabel={view.total.primaryLabel}
				secondaryLabel={view.total.secondaryLabel}
				percentage={view.total.percentage}
			/>

			<ul class="mt-8 space-y-6 border-t border-ink/10 pt-6">
				{#each view.categories as budget (budget.primaryLabel)}
					<li>
						<ProgressBar
							primaryLabel={budget.primaryLabel}
							secondaryLabel={budget.secondaryLabel}
							percentage={budget.percentage}
						/>
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
