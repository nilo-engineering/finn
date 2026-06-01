<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import PeriodWheel from '$lib/components/PeriodWheel.svelte';
	import { swipe } from '$lib/actions/swipe';

	type Budget = {
		primaryLabel: string;
		secondaryLabel: string;
		percentage: number;
	};

	type Period = {
		name: 'Year' | 'Month' | 'Week';
		budgets: Budget[];
	};

	const periods: Period[] = [
		{
			name: 'Year',
			budgets: [
				{ primaryLabel: 'Fixed', secondaryLabel: '$19,440 / $21,600', percentage: 95 },
				{ primaryLabel: 'Comfort', secondaryLabel: '$4,920 / $7,200', percentage: 68 },
				{ primaryLabel: 'Indulgences', secondaryLabel: '$3,300 / $3,600', percentage: 92 },
				{ primaryLabel: 'Self improvement', secondaryLabel: '$1,080 / $3,000', percentage: 36 }
			]
		},
		{
			name: 'Month',
			budgets: [
				{ primaryLabel: 'Fixed', secondaryLabel: '$1,620 / $1,800', percentage: 90 },
				{ primaryLabel: 'Comfort', secondaryLabel: '$410 / $600', percentage: 68 },
				{ primaryLabel: 'Indulgences', secondaryLabel: '$275 / $300', percentage: 92 },
				{ primaryLabel: 'Self improvement', secondaryLabel: '$90 / $250', percentage: 36 }
			]
		},
		{
			name: 'Week',
			budgets: [
				{ primaryLabel: 'Fixed', secondaryLabel: '$405 / $450', percentage: 90 },
				{ primaryLabel: 'Comfort', secondaryLabel: '$103 / $150', percentage: 68 },
				{ primaryLabel: 'Indulgences', secondaryLabel: '$69 / $75', percentage: 92 },
				{ primaryLabel: 'Self improvement', secondaryLabel: '$23 / $63', percentage: 36 }
			]
		}
	];

	let selected = $state<string>(periods[0].name);

	const current = $derived(periods.find((p) => p.name === selected) ?? periods[0]);

	const wheelOptions = periods.map((p) => ({ name: p.name, label: p.name }));

	function step(direction: -1 | 1) {
		const idx = periods.findIndex((p) => p.name === selected);
		const next = Math.max(0, Math.min(periods.length - 1, idx + direction));
		selected = periods[next].name;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			step(-1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			step(1);
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="bg-background text-ink flex min-h-screen flex-col">
	<main
		class="flex-1 px-6 pt-10 pb-6"
		use:swipe={{ onLeft: () => step(1), onRight: () => step(-1) }}
	>
		<h1 class="text-primary-deep mb-8 text-2xl font-semibold">Finn</h1>

		<ul class="space-y-6">
			{#each current.budgets as budget (budget.primaryLabel)}
				<li>
					<ProgressBar
						primaryLabel={budget.primaryLabel}
						secondaryLabel={budget.secondaryLabel}
						percentage={budget.percentage}
					/>
				</li>
			{/each}
		</ul>
	</main>

	<nav class="border-ink/10 sticky bottom-0 border-t bg-white p-4">
		<PeriodWheel options={wheelOptions} bind:value={selected} />
	</nav>
</div>
