<script lang="ts">
	type Props = {
		primaryLabel: string;
		secondaryLabel: string;
		percentage: number;
	};

	let { primaryLabel, secondaryLabel, percentage }: Props = $props();

	const clamped = $derived(Math.max(0, Math.min(100, percentage)));

	const color = $derived(
		clamped >= 95 ? 'bg-red-500' : clamped >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
	);
</script>

<div>
	<div class="mb-2 flex items-baseline justify-between">
		<span class="font-medium">{primaryLabel}</span>
		<span class="text-sm text-neutral-600">{secondaryLabel}</span>
	</div>
	<div
		class="h-3 w-full overflow-hidden rounded-full bg-neutral-200"
		role="progressbar"
		aria-label={primaryLabel}
		aria-valuenow={clamped}
		aria-valuemin="0"
		aria-valuemax="100"
	>
		<div
			class="h-full rounded-full transition-all duration-300 {color}"
			style="width: {clamped}%"
		></div>
	</div>
</div>
