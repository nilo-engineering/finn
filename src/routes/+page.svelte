<script lang="ts">
	import { resolve } from '$app/paths';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Wheel from '$lib/components/Wheel.svelte';
	import AlertButton from '$lib/components/AlertButton.svelte';
	import ExpenseModal from '$lib/components/ExpenseModal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import list from 'iconoir/icons/list.svg?raw';
	import label from 'iconoir/icons/label.svg?raw';
	import bank from 'iconoir/icons/bank.svg?raw';
	import importIcon from 'iconoir/icons/import.svg?raw';
	import logOut from 'iconoir/icons/log-out.svg?raw';
	import { budgetBars, periodOptions } from '$lib/services/dashboard';

	let selected = $state('Year');
	let modalOpen = $state(false);
	const bars = budgetBars();
	const view = $derived($bars?.[selected]);

	async function logout() {
		await fetch('/logout', { method: 'POST' });
		// Hard navigation so hooks re-run and any in-memory state is cleared.
		window.location.href = '/login';
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-semibold text-primary-deep">Finn</h1>
			<div class="flex items-center gap-1">
				<a href={resolve('/transactions')} aria-label="All transactions" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
					<Icon src={list} class="h-5 w-5" />
				</a>
				<a href={resolve('/import')} aria-label="Import transactions" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
					<Icon src={importIcon} class="h-5 w-5" />
				</a>
				<a href={resolve('/categories')} aria-label="Manage categories" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
					<Icon src={label} class="h-5 w-5" />
				</a>
				<a href={resolve('/accounts')} aria-label="Manage accounts" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
					<Icon src={bank} class="h-5 w-5" />
				</a>
				<button type="button" onclick={logout} aria-label="Sign out" class="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
					<Icon src={logOut} class="h-5 w-5" />
				</button>
			</div>
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
