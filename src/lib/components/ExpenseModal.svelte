<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import {
		pendingExpenseCards,
		categoryOptions,
		reviewExpense,
		unreviewExpense,
		renameExpense,
		hideExpense,
		unhideExpense
	} from '$lib/services/expenses';
	import { debounce } from '$lib/utils/debounce';
	import Icon from '$lib/components/Icon.svelte';
	import skipNext from 'iconoir/icons/skip-next.svg?raw';
	import eyeClosed from 'iconoir/icons/eye-closed.svg?raw';

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
	const skipped = new SvelteSet<string>();

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

	let editingTitle = $state(false);
	let titleDraft = $state('');
	let titleInputEl: HTMLInputElement | undefined = $state();

	const saveTitle = debounce((id: string, title: string) => renameExpense(id, title), 400);

	// The liveQuery re-emits a fresh `current` after every save, so reset editing state
	// only when the underlying card actually changes — not on same-card data updates.
	let editedId: string | undefined = $state();
	$effect(() => {
		const id = current?.id;
		if (id !== editedId) {
			saveTitle.cancel();
			editingTitle = false;
			editedId = id;
		}
	});

	// Keep focus inside the dialog: on the input while editing, otherwise on the dialog
	// itself — without this, committing a rename drops focus to <body> and the keydown
	// shortcuts stop firing until the user clicks back into the modal.
	$effect(() => {
		if (editingTitle) titleInputEl?.focus();
		else dialogEl?.focus();
	});

	// Briefly mark the control activated by a shortcut, since (unlike a click) a keypress
	// gives no inherent visual cue. Keyed by 'skip', 'hide', 'undo', or a category id as a string.
	let flashKey: string | null = $state(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	function flash(key: string) {
		flashKey = key;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flashKey = null), 200);
	}

	// Single-level undo for the most recent review action (categorize / skip / rename).
	// `closeWhenExpired` lets the modal linger after the last card so its action stays
	// undoable, then close once the undo window passes.
	let undoAction: { label: string; run: () => void } | null = $state(null);
	let undoTimer: ReturnType<typeof setTimeout> | undefined;
	function registerUndo(label: string, run: () => void, closeWhenExpired = false) {
		undoAction = { label, run };
		clearTimeout(undoTimer);
		undoTimer = setTimeout(() => {
			undoAction = null;
			if (closeWhenExpired) open = false;
		}, 4000);
	}
	function undo() {
		if (!undoAction) return;
		clearTimeout(undoTimer);
		const action = undoAction;
		undoAction = null;
		action.run();
	}

	let titleOriginal = '';

	function startEditingTitle() {
		if (!current) return;
		titleOriginal = current.title;
		titleDraft = current.title;
		editingTitle = true;
	}

	function onTitleInput() {
		if (!current) return;
		saveTitle(current.id, titleDraft.trim());
	}

	function commitTitle() {
		saveTitle.flush();
		editingTitle = false;
		const id = current?.id;
		const next = titleDraft.trim();
		if (id !== undefined && next && next !== titleOriginal) {
			const prev = titleOriginal;
			registerUndo('Title updated', () => renameExpense(id, prev));
		}
	}

	function onTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			titleInputEl?.blur();
		}
	}

	// While editing the title, Escape triggers the dialog's native `cancel` (close).
	// Intercept it so Escape just leaves the input instead of closing the modal.
	function onCancel(e: Event) {
		if (editingTitle) {
			e.preventDefault();
			titleInputEl?.blur();
		}
	}

	// Review shortcuts: r = edit title, s = skip, h = hide, 1..n = pick that category.
	// Disabled while editing the title so the keys type normally, and ignored when a
	// modifier is held so browser shortcuts (e.g. ⌘R) still work.
	function onKeydown(e: KeyboardEvent) {
		if (editingTitle || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === 'r') {
			e.preventDefault();
			startEditingTitle();
		} else if (e.key === 's') {
			e.preventDefault();
			flash('skip');
			skip();
		} else if (e.key === 'h') {
			e.preventDefault();
			flash('hide');
			hide();
		} else if (e.key === 'u') {
			if (!undoAction) return;
			e.preventDefault();
			flash('undo');
			undo();
		} else if (/^[1-9]$/.test(e.key)) {
			const cat = categories[Number(e.key) - 1];
			if (cat) {
				e.preventDefault();
				flash(String(cat.id));
				selectCategory(cat.id);
			}
		}
	}

	async function selectCategory(categoryId: string) {
		if (!current) return;
		const id = current.id;
		const wasLast = queue.length === 1;
		await reviewExpense(id, categoryId);
		registerUndo('Expense categorized', () => unreviewExpense(id), wasLast);
	}

	function skip() {
		if (!current) return;
		const id = current.id;
		const wasLast = queue.length === 1;
		skipped.add(id);
		registerUndo('Expense skipped', () => skipped.delete(id), wasLast);
	}

	// Hiding persists `hidden` in the DB, so the card drops out of the pending queue for
	// good (unlike skip). Undo restores it by clearing the flag again.
	async function hide() {
		if (!current) return;
		const id = current.id;
		const wasLast = queue.length === 1;
		await hideExpense(id);
		registerUndo('Expense hidden', () => unhideExpense(id), wasLast);
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			open = false;
		}
	}

	function onClose() {
		open = false;
		undoAction = null;
		clearTimeout(undoTimer);
	}
</script>

{#snippet keyHint(label: string)}
	<kbd
		class="inline-flex h-4 min-w-4 items-center justify-center rounded border border-current px-1 text-[10px] font-semibold leading-none opacity-40"
		>{label}</kbd
	>
{/snippet}

<dialog
	bind:this={dialogEl}
	tabindex="-1"
	onclose={onClose}
	oncancel={onCancel}
	onkeydown={onKeydown}
	onclick={onBackdropClick}
	class="m-auto w-[min(90vw,360px)] overflow-visible bg-transparent p-0 outline-none backdrop:bg-black/40"
>
	<div class="relative">
		{#if current}
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
					{#if editingTitle}
						<input
							bind:this={titleInputEl}
							bind:value={titleDraft}
							type="text"
							oninput={onTitleInput}
							onfocusout={commitTitle}
							onkeydown={onTitleKeydown}
							class="min-w-0 flex-1 rounded-xl border border-ink/15 px-2 py-1 text-lg font-semibold text-primary-deep outline-none focus:border-primary"
						/>
					{:else}
						<button
							type="button"
							onclick={startEditingTitle}
							class="-mx-2 -my-1 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left text-lg font-semibold text-primary-deep transition-colors hover:bg-ink/5"
						>
							{current.title}
							{@render keyHint('r')}
						</button>
					{/if}
					<div class="flex items-center gap-2">
						<span class="text-xs text-ink/50">{queue.length} left</span>
					</div>
				</div>

				<div class="flex flex-col items-center gap-1">
					<span class="text-4xl font-semibold text-primary-deep">{current.amountLabel}</span>
					{#if current.counterparty}
						<span class="text-center text-sm font-medium text-ink/70">{current.counterparty}</span>
					{/if}
					<span class="text-sm text-ink/60"
						>{current.dateLabel} · {current.accountName} · {current.method}</span
					>
				</div>

				<p class="text-center text-sm text-ink/80">{current.description}</p>

				<div class="grid grid-cols-1 gap-3 pt-2">
					{#each categories as cat, i (cat.id)}
						<button
							type="button"
							onclick={() => selectCategory(cat.id)}
							class="relative flex items-center justify-center rounded-xl px-3 py-3 text-sm font-medium shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 {cat.classes} {flashKey ===
							String(cat.id)
								? 'scale-95 ring-2 ring-ink/40'
								: ''}"
						>
							{#if i < 9}<span class="absolute left-3">{@render keyHint(String(i + 1))}</span>{/if}
							{cat.name}
						</button>
					{/each}
				</div>

				<div class="mt-1 grid grid-cols-2 gap-3">
					<button
						type="button"
						onclick={hide}
						class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-ink/5 hover:text-ink {flashKey ===
						'hide'
							? 'bg-ink/10 text-ink ring-2 ring-ink/20'
							: 'text-ink/60'}"
					>
						<Icon src={eyeClosed} class="h-4 w-4" />
						Hide
						{@render keyHint('h')}
					</button>
					<button
						type="button"
						onclick={skip}
						class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-ink/5 hover:text-ink {flashKey ===
						'skip'
							? 'bg-ink/10 text-ink ring-2 ring-ink/20'
							: 'text-ink/60'}"
					>
						<Icon src={skipNext} class="h-4 w-4" />
						Skip for now
						{@render keyHint('s')}
					</button>
				</div>
			</div>
		{/if}

		{#if undoAction}
			<div
				class="absolute inset-x-0 top-full mt-3 flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-white shadow-xl"
			>
				<span>{undoAction.label}</span>
				<button
					type="button"
					onclick={undo}
					class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-white/15 {flashKey ===
					'undo'
						? 'bg-white/20'
						: ''}"
				>
					Undo
					{@render keyHint('u')}
				</button>
			</div>
		{/if}
	</div>
</dialog>
