<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Wheel from '$lib/components/Wheel.svelte';
	import AlertButton from '$lib/components/AlertButton.svelte';
	import ExpenseModal from '$lib/components/ExpenseModal.svelte';

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

	const pendingExpenses = [
		{
			title: 'Coffee shop',
			description: 'Morning latte at Blue Bottle',
			value: 6.5,
			date: '2026-06-06',
			bank: 'NuBank',
			transactionType: 'Credit'
		},
		{
			title: 'Spotify',
			description: 'Monthly subscription',
			value: 19.9,
			date: '2026-06-04',
			bank: 'NuBank',
			transactionType: 'Credit'
		},
		{
			title: 'Uber',
			description: 'Ride home from office',
			value: 14.2,
			date: '2026-06-03',
			bank: 'BTG Pactual',
			transactionType: 'Debit'
		},
		{
			title: 'Grocery store',
			description: 'Weekly groceries at Pão de Açúcar',
			value: 87.4,
			date: '2026-06-02',
			bank: 'CAIXA',
			transactionType: 'Debit'
		}
	];

	let modalOpen = $state(false);
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<h1 class="mb-8 text-2xl font-semibold text-primary-deep">Finn</h1>

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

	<nav class="sticky bottom-0 p-4">
		<Wheel options={wheelOptions} bind:value={selected} />
	</nav>

	<AlertButton onclick={() => (modalOpen = true)} />
	<ExpenseModal bind:open={modalOpen} expenses={pendingExpenses} />
</div>
