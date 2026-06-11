<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { pendingExpenseCards, categoryOptions, reviewExpense } from '$lib/services/expenses';
	import Icon from '$lib/components/Icon.svelte';
	import skipNext from 'iconoir/icons/skip-next.svg?raw';

	type Props = {
		open: boolean;
	};

	let { open = $bindable() }: Props = $props();

	const cardsStore = pendingExpenseCards();
	const categoriesStore = categoryOptions();
	const cards = $derived($cardsStore ?? []);
	const categories = $derived($categoriesStore ?? []);

	let dialogEl: HTMLDialogElement | undefined = $state();

	// Session-local so skipped expenses stay `pending` in the DB and resurface in the
	// next review session, rather than being dismissed for good.
	const skipped = new SvelteSet<number>();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			skipped.clear();
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	const queue = $derived(cards.filter((c) => !skipped.has(c.id)));
	const current = $derived(queue[0]);

	async function selectCategory(categoryId: number) {
		if (!current) return;
		const wasLast = queue.length === 1;
		await reviewExpense(current.id, categoryId);
		if (wasLast) {
			open = false;
		}
	}

	function skip() {
		if (!current) return;
		const wasLast = queue.length === 1;
		skipped.add(current.id);
		if (wasLast) {
			open = false;
		}
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			open = false;
		}
	}

	function onClose() {
		open = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	onclose={onClose}
	onclick={onBackdropClick}
	class="m-auto w-[min(90vw,360px)] overflow-visible bg-transparent p-0 backdrop:bg-black/40"
>
	{#if current}
		<div class="relative">
			{#if queue.length > 2}
				<div
					aria-hidden="true"
					class="absolute inset-x-6 -bottom-3 h-6 rounded-2xl border border-ink/10 bg-white shadow-sm"
				></div>
			{/if}
			{#if queue.length > 1}
				<div
					aria-hidden="true"
					class="absolute inset-x-3 -bottom-2 h-6 rounded-2xl border border-ink/10 bg-white shadow-sm"
				></div>
			{/if}

			<div class="relative flex flex-col gap-5 rounded-2xl bg-white p-6 text-ink shadow-xl">
				<div class="flex items-start justify-between gap-3">
					<h2 class="text-lg font-semibold text-primary-deep">{current.title}</h2>
					<div class="flex items-center gap-2">
						<span class="text-xs text-ink/50">{queue.length} left</span>
					</div>
				</div>

				<div class="flex flex-col items-center gap-1">
					<span class="text-4xl font-semibold text-primary-deep">{current.amountLabel}</span>
					<span class="text-sm text-ink/60"
						>{current.dateLabel} · {current.accountName} · {current.method}</span
					>
				</div>

				<p class="text-center text-sm text-ink/80">{current.description}</p>

				<div class="grid grid-cols-2 gap-3 pt-2">
					{#each categories as cat (cat.id)}
						<button
							type="button"
							onclick={() => selectCategory(cat.id)}
							class="rounded-xl px-3 py-3 text-sm font-medium shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 {cat.classes}"
						>
							{cat.name}
						</button>
					{/each}
				</div>

				<button
					type="button"
					onclick={skip}
					class="mt-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
				>
					<Icon src={skipNext} class="h-4 w-4" />
					Skip for now
				</button>
			</div>
		</div>
	{/if}
</dialog>
