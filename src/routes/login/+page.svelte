<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Sign in · Finn</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-6 text-ink">
	<form method="POST" use:enhance class="w-full max-w-80 space-y-6">
		<h1 class="text-center text-2xl font-semibold text-primary-deep">Finn</h1>

		<div class="space-y-2">
			<input type="password" name="password" placeholder="Password" autocomplete="current-password" aria-label="Password" class="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none focus:border-primary" />
			{#if form?.error}
				<p class="text-sm text-alert">{form.error}</p>
			{/if}
		</div>

		<button type="submit" class="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary-deep"> Sign in </button>
	</form>
</div>
