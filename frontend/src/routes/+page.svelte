<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';

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

	let selected = $state(periods[0].name);

	const current = $derived(periods.find((p) => p.name === selected) ?? periods[0]);
</script>

<div class="bg-background text-ink flex min-h-screen flex-col">
	<main class="flex-1 px-6 pt-10 pb-6">
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

	<nav class="border-ink/10 sticky bottom-0 grid grid-cols-3 gap-2 border-t bg-white p-4">
		{#each periods as p (p.name)}
			<button
				type="button"
				onclick={() => (selected = p.name)}
				class="rounded-full px-4 py-3 text-sm font-medium transition-colors
					{selected === p.name
					? 'bg-primary text-white'
					: 'bg-ink/5 text-ink/70 hover:bg-ink/10'}"
			>
				{p.name}
			</button>
		{/each}
	</nav>
</div>
