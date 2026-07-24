<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MOVEMENT_TYPES, movementType } from '$lib/modules/movements/movements.js';
	import { showToast } from '$lib/utils/toast.svelte.js';
	import SelectField from '$lib/components/SelectField.svelte';
	import type { SelectOption } from '$lib/components/SelectField.svelte';
	import calendarRotate from 'iconoir/icons/regular/calendar-rotate.svg?raw';
	import calendar from 'iconoir/icons/regular/calendar.svg?raw';
	import editPencil from 'iconoir/icons/regular/edit-pencil.svg?raw';
	import Icon from '$lib/components/Icon.svelte';
	import chevronIcon from 'iconoir/icons/regular/nav-arrow-down.svg?raw';

	let { form } = $props();

	// Seeded once from the ?type the AddBottomSheet linked to; the picker can change it.
	let typeKey = $state(movementType(page.url.searchParams.get('type'))?.key ?? 'in');
	let amount = $state('');
	let description = $state('');
	let date = $state(todayISO());
	let repeat = $state('none');

	const meta = $derived(movementType(typeKey) ?? MOVEMENT_TYPES[0]);

	const typeOptions: SelectOption[] = MOVEMENT_TYPES.map((t) => ({
		value: t.key,
		label: t.label,
		asset: { icon: t.icon, backgroundColor: t.color, color: 'white' }
	}));

	const repeatOptions: SelectOption[] = [
		{ value: 'none', label: 'no recurrency' },
		{ value: 'monthly', label: 'monthly' },
		{ value: 'weekly', label: 'weekly' },
		{ value: 'daily', label: 'daily' },
		{ value: 'installments', label: 'installments' }
	];

	function todayISO(): string {
		const d = new Date();
		return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
	}

	function leave() {
		if (history.length > 1) history.back();
		else goto(resolve('/balances'));
	}

	let dateInput: HTMLInputElement;

	const dateLabel = $derived(
		new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(
			new Date(`${date}T00:00`)
		)
	);

	// The row is a button; the real date input is visually hidden, so open its picker here.
	function openDatePicker() {
		dateInput.showPicker?.();
	}

	// Money mask: keep only digits and fill them in from the right as cents, e.g.
	// "1234567" -> "12,345.67". The `$` prefix lives outside the input.
	function maskValue(event: Event & { currentTarget: HTMLInputElement }) {
		const cents = Number(event.currentTarget.value.replace(/\D/g, ''));
		if (cents === 0) {
			// No significant digits left: clear so the placeholder shows instead of "0.00".
			amount = '';
		} else {
			const whole = Math.floor(cents / 100).toLocaleString('en-US');
			amount = `${whole}.${String(cents % 100).padStart(2, '0')}`;
		}
		event.currentTarget.value = amount;
	}
</script>

<form
	class="page"
	method="POST"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				showToast(`${meta.label} added`);
				leave();
			} else {
				await update();
			}
		};
	}}
>

	<div class="fields">
		<div class="field value-field">
			<span class="prefix">$</span>
			<input
				class="value-input"
				name="value"
				inputmode="numeric"
				placeholder="0.00"
				aria-label="value"
				value={amount}
				oninput={maskValue}
			/>
		</div>

		<SelectField title="type" bind:value={typeKey} options={typeOptions} />

		<label class="field">
			<Icon svg={editPencil} />
			<input class="input" name="description" placeholder="description" bind:value={description} />
		</label>

		<button type="button" class="field" onclick={openDatePicker}>
			<Icon svg={calendar} />
			<span class="label">date</span>
			<div class="flex-1"></div>
			<span class="date-value">{dateLabel}</span>
			<Icon svg={chevronIcon} size="1.25rem" color="#aaaaaa" />
		</button>
		<input
			class="sr-only"
			type="date"
			name="date"
			tabindex="-1"
			aria-hidden="true"
			bind:this={dateInput}
			bind:value={date}
		/>

		<SelectField title="repeat" icon={calendarRotate} bind:value={repeat} options={repeatOptions} />
	</div>

	<input type="hidden" name="type" value={typeKey} />
	<input type="hidden" name="repeat" value={repeat} />

	<div class="actions">
		<button class="add" type="submit" style:background-color={meta.color}>add {meta.label}</button>
		<button class="cancel" type="button" onclick={leave}>cancel</button>
	</div>
	
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}
</form>

<style>
	@reference '../../layout.css';

	.page {
		@apply flex min-h-full flex-col items-center pt-[env(safe-area-inset-top)] pb-8;
	}

	.error {
		@apply w-[90%] mt-6 rounded-lg bg-[#dc2626]/10 px-4 py-3 text-center leading-tight font-semibold text-[#dc2626];
	}

	/* Each row carries its own bottom border rather than a container `divide-y`, which
	   Svelte's style scoping would not apply across the SelectField child components. */
	.fields {
		@apply flex flex-col w-full border-t border-[#cccccc];
	}

	.field {
		@apply flex w-full items-center justify-start gap-3 border-b border-[#cccccc] px-5 py-7 text-lg leading-none;
	}

	/* The date row is a button (opens the native picker); give it the pointer affordance. */
	button.field {
		@apply cursor-pointer;
	}

	.label {
		@apply font-semibold;
	}

	.input {
		@apply min-w-0 flex-1 border-none bg-transparent leading-none font-semibold outline-none;
	}

	.input::placeholder,
	.value-input::placeholder {
		@apply font-normal;
	}

	/* The value is the primary field, so it stands taller and larger than the rest. */
	.value-field {
		@apply flex items-center gap-2 border-b border-[#cccccc] px-5 py-9;
	}

	.prefix {
		@apply text-4xl leading-none font-semibold;
	}

	.value-input {
		@apply min-w-0 flex-1 border-none bg-transparent text-3xl leading-none font-semibold outline-none;
	}

	.actions {
		@apply mt-10 flex flex-col w-full items-center gap-4;
	}

	.add {
		@apply w-[90%] cursor-pointer rounded-full border-none py-5 text-lg leading-none font-semibold text-white;
	}

	.cancel {
		@apply w-[90%] cursor-pointer border-none bg-transparent py-5 text-lg leading-none font-semibold text-[#8a8a8a];
	}
</style>
