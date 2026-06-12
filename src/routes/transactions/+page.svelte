<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import navArrowLeft from 'iconoir/icons/nav-arrow-left.svg?raw';
	import { transactionList } from '$lib/services/transactions';

	const txStore = transactionList();
	const transactions = $derived($txStore ?? []);
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<Icon src={navArrowLeft} class="h-5 w-5" />
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Transactions</h1>
		</div>

		{#if transactions.length === 0}
			<p class="mt-16 text-center text-sm text-ink/50">No transactions yet</p>
		{:else}
			<ul class="space-y-2">
				{#each transactions as tx, i (tx.id)}
					{#if i === 0 || tx.monthLabel !== transactions[i - 1].monthLabel}
						<li class="px-1 pt-4 pb-1 text-sm font-semibold text-ink/40 first:pt-0">{tx.monthLabel}</li>
					{/if}
					<li class="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
						<div class="min-w-0">
							<p class="truncate text-base font-medium">{tx.title}</p>
							<p class="truncate text-sm text-ink/50">{tx.accountName} · {tx.categoryName}</p>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-sm text-ink/50">{tx.dateLabel}</p>
							<p class="font-medium {tx.direction === 'in' ? 'text-accent' : 'text-alert'}">
								{tx.direction === 'in' ? '+' : '−'}{tx.amountLabel}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>
