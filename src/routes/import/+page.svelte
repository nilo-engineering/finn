<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import navArrowLeft from 'iconoir/icons/nav-arrow-left.svg?raw';
	import { money, formatDate } from '$lib/services/format';
	import { previewImport, commitImport, type ImportPreview } from '$lib/services/transactions';
	import { profiles } from '$lib/import/profiles';

	let file = $state<File | null>(null);
	let preview = $state<ImportPreview | null>(null);
	let manualId = $state('');
	let busy = $state(false);
	let importedCount = $state<number | null>(null);

	const needsManual = $derived(preview?.profile === null);

	async function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		file = input.files?.[0] ?? null;
		preview = null;
		manualId = '';
		importedCount = null;
		if (!file) return;
		busy = true;
		preview = await previewImport(file);
		busy = false;
	}

	async function applyManual() {
		if (!file || !manualId) return;
		busy = true;
		preview = await previewImport(file, manualId);
		busy = false;
	}

	async function confirmImport() {
		if (!preview || preview.txs.length === 0) return;
		busy = true;
		importedCount = await commitImport(preview.txs);
		busy = false;
		preview = null;
		file = null;
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<Icon src={navArrowLeft} class="h-5 w-5" />
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Import</h1>
		</div>

		<label class="flex flex-col gap-1">
			<span class="text-sm text-ink/60">CSV file</span>
			<input type="file" accept=".csv,text/csv" onchange={onFileChange} class="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-primary" />
		</label>

		{#if importedCount !== null}
			<p class="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
				Imported {importedCount} transaction{importedCount === 1 ? '' : 's'}.
			</p>
		{/if}

		{#if busy}
			<p class="mt-4 text-sm text-ink/50">Reading file…</p>
		{/if}

		{#if needsManual}
			<div class="mt-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
				<p class="text-sm text-ink/70">Couldn't recognize this file's format. Pick the matching bank export:</p>
				<select bind:value={manualId} class="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary">
					<option value="" disabled>Select a format…</option>
					{#each profiles as p (p.id)}
						<option value={p.id}>{p.label}</option>
					{/each}
				</select>
				<button type="button" onclick={applyManual} disabled={!manualId} class="self-start rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50"> Parse </button>
			</div>
		{/if}

		{#if preview?.profile && !preview.accountFound}
			<p class="mt-4 rounded-xl bg-alert/10 px-4 py-3 text-sm text-alert">
				Detected <strong>{preview.profile.label}</strong>, but no account named “{preview.profile.accountName}” exists.
				<a href={resolve('/accounts')} class="underline">Create it first</a>, then re-upload.
			</p>
		{/if}

		{#if preview?.error}
			<p class="mt-4 rounded-xl bg-alert/10 px-4 py-3 text-sm text-alert">{preview.error}</p>
		{/if}

		{#if preview?.profile && preview.accountFound}
			<div class="mt-6">
				<div class="mb-2 flex items-baseline justify-between">
					<span class="text-sm font-medium text-primary-deep">{preview.profile.label}</span>
					<span class="text-xs text-ink/50">
						{preview.txs.length} row{preview.txs.length === 1 ? '' : 's'}{preview.errors.length > 0 ? ` · ${preview.errors.length} skipped` : ''}
					</span>
				</div>

				{#if preview.txs.length > 0}
					<ul class="max-h-80 space-y-2 overflow-auto rounded-xl border border-ink/10 bg-white p-2 shadow-sm">
						{#each preview.txs as tx, i (i)}
							<li class="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-ink/5">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{tx.title}</p>
									<p class="text-xs text-ink/50">{formatDate(tx.date)} · {tx.time}</p>
								</div>
								<span class="shrink-0 text-sm font-semibold {tx.direction === 'out' ? 'text-alert' : 'text-accent'}">
									{tx.direction === 'out' ? '−' : '+'}{money(tx.amount)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}

				{#if preview.errors.length > 0}
					<details class="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-sm shadow-sm">
						<summary class="cursor-pointer text-ink/60">{preview.errors.length} row{preview.errors.length === 1 ? '' : 's'} skipped</summary>
						<ul class="mt-2 space-y-1">
							{#each preview.errors as err (err.row)}
								<li class="text-xs text-alert">Line {err.row}: {err.reason}</li>
							{/each}
						</ul>
					</details>
				{/if}

				<button type="button" onclick={confirmImport} disabled={busy || preview.txs.length === 0} class="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
					Import {preview.txs.length} transaction{preview.txs.length === 1 ? '' : 's'}
				</button>
			</div>
		{/if}
	</main>
</div>
