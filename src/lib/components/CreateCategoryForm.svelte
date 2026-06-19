<script lang="ts">
	import { createCategory } from '$lib/services/categories';
	import { CATEGORY_COLORS } from '$lib/categoryColors';

	type Props = {
		close: () => void;
	};

	let { close }: Props = $props();

	let name = $state('');
	let classes = $state(CATEGORY_COLORS[0].classes);
	let error = $state('');

	async function save(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			error = 'Please enter a name.';
			return;
		}
		try {
			await createCategory(trimmed, classes);
			close();
		} catch (err) {
			console.error(err)
			if (err instanceof Error && err.name === 'ConstraintError') {
				error = 'A category with that name already exists.';
			} else {
				error = 'Could not save the category.';
			}
		}
	}
</script>

<form class="flex flex-col gap-5 rounded-2xl bg-white p-6 text-ink shadow-xl" onsubmit={save}>
	<h2 class="text-lg font-semibold text-primary-deep">Add category</h2>

	<label class="flex flex-col gap-1">
		<span class="text-sm text-ink/60">Name</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input type="text" bind:value={name} autofocus placeholder="e.g. Travel" class="rounded-xl border border-ink/15 px-3 py-2 text-base outline-none focus:border-primary" />
	</label>

	<div class="flex flex-col gap-2">
		<span class="text-sm text-ink/60">Color</span>
		<div class="flex gap-2">
			{#each CATEGORY_COLORS as color (color.classes)}
				<button type="button" aria-label={color.label} aria-pressed={classes === color.classes} onclick={() => (classes = color.classes)} class="h-9 w-9 rounded-full {color.classes} {classes === color.classes ? 'ring-2 ring-ink ring-offset-2' : ''}"></button>
			{/each}
		</div>
	</div>

	{#if error}
		<p class="text-sm text-alert">{error}</p>
	{/if}

	<div class="flex items-center justify-end gap-2 pt-1">
		<button type="button" onclick={close} class="rounded-xl px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"> Cancel </button>
		<button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95"> Save </button>
	</div>
</form>
