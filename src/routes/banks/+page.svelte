<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import navArrowLeft from 'iconoir/icons/nav-arrow-left.svg?raw';
	import trash from 'iconoir/icons/trash.svg?raw';
	import { fullSync } from '$lib/sync/engine';
	import { formatDate } from '$lib/services/format';

	type Item = { id: string; label: string | null; last_synced_at: number | null };

	let items = $state<Item[]>([]);
	let itemId = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);
	let result = $state<string | null>(null);

	async function loadItems() {
		const res = await fetch('/api/banks/items');
		if (res.ok) items = ((await res.json()) as { items: Item[] }).items;
	}

	onMount(loadItems);

	async function registerItem() {
		const id = itemId.trim();
		if (!id) return;
		busy = true;
		error = null;
		result = null;
		const res = await fetch('/api/banks/items', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ itemId: id })
		});
		if (res.ok) {
			itemId = '';
			await loadItems();
		} else {
			error = await res.text();
		}
		busy = false;
	}

	async function removeItem(id: string) {
		await fetch(`/api/banks/items/${id}`, { method: 'DELETE' });
		await loadItems();
	}

	async function syncNow(mode: 'fast' | 'full') {
		busy = true;
		error = null;
		result = null;
		const res = await fetch('/api/banks/sync', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ mode })
		});
		if (res.ok) {
			const { accountsAdded, transactionsAdded } = (await res.json()) as {
				accountsAdded: number;
				transactionsAdded: number;
			};
			// Full reconciliation so every server row (accounts + transactions) lands in
			// Dexie, not just the delta since the last cursor.
			await fullSync();
			await loadItems();
			result = `Added ${transactionsAdded} transaction${transactionsAdded === 1 ? '' : 's'}${accountsAdded > 0 ? ` and ${accountsAdded} account${accountsAdded === 1 ? '' : 's'}` : ''}.`;
		} else {
			error = await res.text();
		}
		busy = false;
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<Icon src={navArrowLeft} class="h-5 w-5" />
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Banks</h1>
		</div>

		<p class="mb-4 text-sm text-ink/60">Connect your banks in MeuPluggy, then paste an itemId here. Syncing pulls the latest transactions as pending, ready to review.</p>

		<div class="flex gap-2">
			<input type="text" bind:value={itemId} placeholder="Paste an itemId…" class="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary" />
			<button type="button" onclick={registerItem} disabled={busy || !itemId.trim()} class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50"> Add </button>
		</div>

		{#if error}
			<p class="mt-4 rounded-xl bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>
		{/if}

		{#if result}
			<p class="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent">{result}</p>
		{/if}

		{#if items.length > 0}
			<ul class="mt-6 space-y-2">
				{#each items as item (item.id)}
					<li class="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{item.label ?? item.id}</p>
							<p class="text-xs text-ink/50">
								{item.last_synced_at ? `Last synced ${formatDate(new Date(item.last_synced_at).toISOString().slice(0, 10))}` : 'Never synced'}
							</p>
						</div>
						<button type="button" aria-label="Remove connection" onclick={() => removeItem(item.id)} class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-alert">
							<Icon src={trash} class="h-4 w-4" />
						</button>
					</li>
				{/each}
			</ul>

			<div class="mt-6 flex gap-2">
				<button type="button" onclick={() => syncNow('fast')} disabled={busy} class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
					{busy ? 'Syncing…' : 'Fast sync'}
				</button>
				<button type="button" onclick={() => syncNow('full')} disabled={busy} class="flex-1 rounded-xl border border-primary px-4 py-3 text-sm font-medium text-primary shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
					{busy ? 'Syncing…' : 'Full sync'}
				</button>
			</div>
			<p class="mt-2 text-xs text-ink/50">Fast sync pulls new transactions since the last sync. Full sync re-pulls everything from the start of this year.</p>
		{:else}
			<p class="mt-6 text-sm text-ink/50">No connections yet.</p>
		{/if}
	</main>
</div>
