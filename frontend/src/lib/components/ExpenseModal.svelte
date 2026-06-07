<script lang="ts">
	type Expense = {
		title: string;
		description: string;
		value: number;
		date: string;
		bank: string;
		transactionType: string;
	};

	type Props = {
		open: boolean;
		expenses: Expense[];
	};

	let { open = $bindable(), expenses }: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let queue = $state<Expense[]>([]);

	$effect(() => {
		if (open) {
			queue = [...expenses];
		}
	});

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	const currencyFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});
	const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

	const current = $derived(queue[0]);
	const formattedValue = $derived(current ? currencyFmt.format(current.value) : '');
	const formattedDate = $derived(current ? dateFmt.format(new Date(current.date)) : '');

	const categories = [
		{ name: 'Fixed', classes: 'bg-accent text-white' },
		{ name: 'Comfort', classes: 'bg-primary text-white' },
		{ name: 'Indulgences', classes: 'bg-highlight text-ink' },
		{ name: 'Self Improvement', classes: 'bg-alert text-white' }
	] as const;

	function selectCategory(name: string) {
		if (!current) return;
		console.log('category selected:', name, 'for', current.title);
		queue = queue.slice(1);
		if (queue.length === 0) {
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
						<button
							type="button"
							aria-label="Close"
							onclick={() => (open = false)}
							class="-mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-ink/60 hover:text-ink"
						>
							×
						</button>
					</div>
				</div>

				<div class="flex flex-col items-center gap-1">
					<span class="text-4xl font-semibold text-primary-deep">{formattedValue}</span>
					<span class="text-sm text-ink/60"
						>{formattedDate} · {current.bank} · {current.transactionType}</span
					>
				</div>

				<p class="text-center text-sm text-ink/80">{current.description}</p>

				<div class="grid grid-cols-2 gap-3 pt-2">
					{#each categories as cat (cat.name)}
						<button
							type="button"
							onclick={() => selectCategory(cat.name)}
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
