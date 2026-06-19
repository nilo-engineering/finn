<script lang="ts">
	import { resolve } from '$app/paths';
	import Modal from '$lib/components/Modal.svelte';
	import CreateAccountForm from '$lib/components/CreateAccountForm.svelte';
	import EditAccountForm from '$lib/components/EditAccountForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import navArrowLeft from 'iconoir/icons/nav-arrow-left.svg?raw';
	import editPencil from 'iconoir/icons/edit-pencil.svg?raw';
	import { accountList } from '$lib/services/accounts';
	import type { AccountView } from '$lib/services/types';

	const accountsStore = accountList();
	const accounts = $derived($accountsStore ?? []);

	let createOpen = $state(false);
	let editOpen = $state(false);
	let editing: AccountView | null = $state(null);

	function edit(account: AccountView) {
		editing = account;
		editOpen = true;
	}
</script>

<div class="mx-auto flex min-h-screen w-full max-w-125 flex-col bg-background text-ink">
	<main class="flex-1 px-6 pt-10 pb-6">
		<div class="mb-8 flex items-center gap-3">
			<a href={resolve('/')} aria-label="Back to dashboard" class="flex h-8 w-8 items-center justify-center rounded-full text-primary-deep hover:bg-ink/5">
				<Icon src={navArrowLeft} class="h-5 w-5" />
			</a>
			<h1 class="text-2xl font-semibold text-primary-deep">Accounts</h1>
		</div>

		<ul class="space-y-2">
			{#each accounts as account (account.id)}
				{@const displayName = account.customName?.trim() || account.name}
				<li class="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
					<span class="flex flex-col">
						<span class="flex items-center gap-2">
							<span class="text-base font-medium">{displayName}</span>
							{#if account.hidden}
								<span class="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink/50">Hidden</span>
							{/if}
						</span>
						{#if account.customName?.trim()}
							<span class="text-xs text-ink/40">{account.name}</span>
						{/if}
					</span>
					<button type="button" aria-label="Edit {displayName}" onclick={() => edit(account)} class="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
						<Icon src={editPencil} class="h-4 w-4" />
					</button>
				</li>
			{/each}
		</ul>

		<button type="button" onclick={() => (createOpen = true)} class="mt-4 w-full rounded-xl border border-dashed border-ink/20 px-4 py-3 text-sm font-medium text-ink/70 hover:border-primary hover:text-primary"> + Add account </button>
	</main>

	<Modal bind:open={createOpen}>
		<CreateAccountForm close={() => (createOpen = false)} />
	</Modal>

	<Modal bind:open={editOpen}>
		{#key editing?.id}
			{#if editing}
				<EditAccountForm account={editing} close={() => (editOpen = false)} />
			{/if}
		{/key}
	</Modal>
</div>
