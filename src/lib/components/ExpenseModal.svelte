<script lang="ts">
	import { pendingExpenseCards, categoryOptions, reviewExpense } from '$lib/services/expenses';

	type Props = {
		open: boolean;
	};

	let { open = $bindable() }: Props = $props();

	const cardsStore = pendingExpenseCards();
	const categoriesStore = categoryOptions();
	const cards = $derived($cardsStore ?? []);
	const categories = $derived($categoriesStore ?? []);

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	// `cards` is the live list of pending items; reviewing one drops it from the
	// list, so the next pending item becomes `current` automatically.
	const current = $derived(cards[0]);

	async function selectCategory(categoryId: number) {
		if (!current) return;
		const wasLast = cards.length === 1;
		await reviewExpense(current.id, categoryId);
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
			{#if cards.length > 2}
				<div
					aria-hidden="true"
					class="absolute inset-x-6 -bottom-3 h-6 rounded-2xl border border-ink/10 bg-white shadow-sm"
				></div>
			{/if}
			{#if cards.length > 1}
				<div
					aria-hidden="true"
					class="absolute inset-x-3 -bottom-2 h-6 rounded-2xl border border-ink/10 bg-white shadow-sm"
				></div>
			{/if}

			<div class="relative flex flex-col gap-5 rounded-2xl bg-white p-6 text-ink shadow-xl">
				<div class="flex items-start justify-between gap-3">
					<h2 class="text-lg font-semibold text-primary-deep">{current.title}</h2>
					<div class="flex items-center gap-2">
						<span class="text-xs text-ink/50">{cards.length} left</span>
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
			</div>
		</div>
	{/if}
</dialog>
