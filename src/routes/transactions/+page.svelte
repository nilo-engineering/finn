<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import FilterPill from '$lib/components/FilterPill.svelte';
	import navArrowLeft from 'iconoir/icons/nav-arrow-left.svg?raw';
	import eyeClosed from 'iconoir/icons/eye-closed.svg?raw';
	import eye from 'iconoir/icons/eye.svg?raw';
	import { transactionList, renameTransaction, setTransactionHidden } from '$lib/services/transactions';
	import { debounce } from '$lib/utils/debounce';

	const txStore = transactionList();
	const transactions = $derived($txStore ?? []);

	let search = $state('');
	let direction = $state(''); // '' | 'in' | 'out'
	let method = $state(''); // '' | 'Credit' | 'Debit' | ...
	let account = $state(''); // '' | accountName
	let month = $state(''); // '' | monthLabel

	const directionOptions = [
		{ value: 'in', label: 'Money in' },
		{ value: 'out', label: 'Money out' }
	];
	// Distinct values come from the full list so options stay available regardless of active filters.
	const methodOptions = $derived(distinct(transactions.map((t) => t.method)));
	const accountOptions = $derived(distinct(transactions.map((t) => t.accountName)));
	const monthOptions = $derived(distinct(transactions.map((t) => t.monthLabel)));

	function distinct(values: string[]): { value: string; label: string }[] {
		return [...new Set(values.filter(Boolean))].map((v) => ({ value: v, label: v }));
	}

	const anyActive = $derived(
		search.trim() !== '' || direction !== '' || method !== '' || account !== '' || month !== ''
	);

	const filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return transactions.filter((t) => {
			if (direction && t.direction !== direction) return false;
			if (method && t.method !== method) return false;
			if (account && t.accountName !== account) return false;
			if (month && t.monthLabel !== month) return false;
			if (
				q &&
				!t.title.toLowerCase().includes(q) &&
				!t.description.toLowerCase().includes(q) &&
				!t.amountLabel.toLowerCase().includes(q)
			)
				return false;
			return true;
		});
	});

	function clearFilters() {
		search = '';
		direction = '';
		method = '';
		account = '';
		month = '';
	}

	let editingId: number | null = $state(null);
	let titleDraft = $state('');
	let titleInputEl: HTMLInputElement | undefined = $state();

	const saveTitle = debounce((id: number, title: string) => renameTransaction(id, title), 400);

	$effect(() => {
		if (editingId !== null) titleInputEl?.focus();
	});

	function startEditing(id: number, title: string) {
		titleDraft = title;
		editingId = id;
	}

	function onTitleInput() {
		if (editingId === null) return;
		saveTitle(editingId, titleDraft.trim());
	}

	function commitTitle() {
		saveTitle.flush();
		editingId = null;
	}

	function onTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') {
			e.preventDefault();
			titleInputEl?.blur();
		}
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<Icon src={navArrowLeft} class="h-5 w-5" />
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Transactions</h1>
		</div>

		{#if transactions.length > 0}
			<div class="mb-6 space-y-3">
				<input
					bind:value={search}
					type="text"
					placeholder="Search title, description, or value"
					class="w-full rounded-xl border border-ink/15 px-3 py-2 text-base outline-none focus:border-primary"
				/>
				<div class="flex flex-wrap items-center gap-2">
					<FilterPill label="Direction" bind:value={direction} options={directionOptions} />
					<FilterPill label="Method" bind:value={method} options={methodOptions} />
					<FilterPill label="Account" bind:value={account} options={accountOptions} />
					<FilterPill label="Month" bind:value={month} options={monthOptions} />
					{#if anyActive}
						<button
							type="button"
							onclick={clearFilters}
							class="rounded-full px-3 py-1 text-sm text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
						>
							Clear
						</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if transactions.length === 0}
			<p class="mt-16 text-center text-sm text-ink/50">No transactions yet</p>
		{:else if filtered.length === 0}
			<p class="mt-16 text-center text-sm text-ink/50">No transactions match your filters</p>
		{:else}
			<ul class="space-y-2">
				{#each filtered as tx, i (tx.id)}
					{#if i === 0 || tx.monthLabel !== filtered[i - 1].monthLabel}
						<li class="px-1 pt-4 pb-1 text-sm font-semibold text-ink/40 first:pt-0">{tx.monthLabel}</li>
					{/if}
					<li
						class="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm transition-opacity {tx.hidden
							? 'opacity-50'
							: ''}"
					>
						<div class="min-w-0">
							{#if editingId === tx.id}
								<input
									bind:this={titleInputEl}
									bind:value={titleDraft}
									type="text"
									oninput={onTitleInput}
									onfocusout={commitTitle}
									onkeydown={onTitleKeydown}
									class="w-full rounded-lg border border-ink/15 px-2 py-0.5 text-base font-medium outline-none focus:border-primary"
								/>
							{:else}
								<button
									type="button"
									onclick={() => startEditing(tx.id, tx.title)}
									class="-mx-2 -my-0.5 block w-[calc(100%+1rem)] truncate rounded-lg px-2 py-0.5 text-left text-base font-medium transition-colors hover:bg-ink/5"
								>
									{tx.title}
								</button>
							{/if}
							<p class="truncate text-sm text-ink/50">
								{tx.accountName} · {tx.categoryName} · {tx.method}
							</p>
							{#if tx.description}
								<p class="truncate text-xs text-ink/40">{tx.description}</p>
							{/if}
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<div class="text-right">
								<p class="text-sm text-ink/50">{tx.dateLabel}</p>
								<p class="font-medium {tx.direction === 'in' ? 'text-accent' : 'text-alert'}">
									{tx.direction === 'in' ? '+' : '−'}{tx.amountLabel}
								</p>
							</div>
							<button
								type="button"
								onclick={() => setTransactionHidden(tx.id, !tx.hidden)}
								aria-label={tx.hidden ? 'Show transaction' : 'Hide transaction'}
								class="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
							>
								<Icon src={tx.hidden ? eye : eyeClosed} class="h-4 w-4" />
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>
