<script lang="ts">
	type Option = { value: string; label: string };

	let {
		label,
		value = $bindable(''),
		options
	}: { label: string; value: string; options: Option[] } = $props();

	const active = $derived(value !== '');
</script>

<select
	bind:value
	aria-label={label}
	class="cursor-pointer rounded-full border px-3 py-1 text-sm outline-none transition-colors {active
		? 'border-primary bg-primary/5 text-primary-deep'
		: 'border-ink/15 text-ink/60 hover:border-ink/30'}"
>
	<option value="">{label}</option>
	{#each options as opt (opt.value)}
		<option value={opt.value}>{opt.label}</option>
	{/each}
</select>
