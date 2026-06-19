<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	// The original data behind a transaction, as returned by GET /api/transactions/[id].
	export type RawPayload = {
		externalId: string | null;
		raw: unknown;
		sourceRow: string | null;
		error?: string;
	};

	type Props = {
		open: boolean;
		loading: boolean;
		payload: RawPayload | null;
	};

	let { open = $bindable(), loading, payload }: Props = $props();

	// Pretty-printed JSON for provider rows; the raw line for CSV imports; otherwise null.
	const body = $derived.by(() => {
		if (!payload) return null;
		if (payload.raw != null) return JSON.stringify(payload.raw, null, 2);
		if (payload.sourceRow) return payload.sourceRow;
		return null;
	});
</script>

<Modal bind:open class="w-[min(92vw,640px)]">
	<div class="flex max-h-[80vh] flex-col gap-3 rounded-2xl bg-white p-6 text-ink shadow-xl">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<h2 class="text-lg font-semibold text-primary-deep">Original data</h2>
				<p class="truncate text-xs text-ink/50">
					{payload?.externalId ? `External ID: ${payload.externalId}` : '—'}
				</p>
			</div>
			<button type="button" onclick={() => (open = false)} class="-mt-1 -mr-2 rounded-lg px-2 py-1 text-sm text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"> Close </button>
		</div>

		{#if loading}
			<p class="py-8 text-center text-sm text-ink/50">Loading…</p>
		{:else if payload?.error}
			<p class="rounded-xl bg-alert/10 px-3 py-2 text-sm text-alert">{payload.error}</p>
		{:else if body}
			<pre class="overflow-auto rounded-xl bg-ink/5 p-4 font-mono text-xs whitespace-pre-wrap text-ink/80">{body}</pre>
		{:else}
			<p class="py-8 text-center text-sm text-ink/50">No original data</p>
		{/if}
	</div>
</Modal>
