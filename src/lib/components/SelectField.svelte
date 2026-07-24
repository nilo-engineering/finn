<script lang="ts" module>
	import type { BadgeProps } from './Badge.svelte';

	export interface SelectOption {
		value: string;
		label: string;
		/** Optional leading badge. */
		asset?: BadgeProps;
	}
</script>

<script lang="ts">
	import Icon from './Icon.svelte';
	import Badge from './Badge.svelte';
	import xmarkIcon from 'iconoir/icons/regular/xmark.svg?raw';
	import chevronIcon from 'iconoir/icons/regular/nav-arrow-down.svg?raw';

	interface Props {
		/** Left-hand field label, also used as the sheet title. */
		title: string;
		/** Selected option value. */
		value: string;
		options: SelectOption[];
		/** Raw SVG shown as a leading icon when the selected option has no asset. */
		icon?: string;
	}

	let { title, value = $bindable(), options, icon }: Props = $props();

	// Unique per instance so the invoker's `commandfor` targets this sheet's dialog.
	const id = $props.id();

	let dialogEl: HTMLDialogElement;

	const selected = $derived(options.find((o) => o.value === value));

	function pick(option: SelectOption) {
		value = option.value;
		dialogEl.close();
	}
</script>

<button class="field" type="button" command="show-modal" commandfor={id}>
	<span class="value">
		{#if icon}
			<Icon svg={icon} />
		{:else if selected?.asset}
			<Badge {...selected.asset} />
		{/if}
		<span>{selected?.label ?? value}</span>
	</span>
	<Icon svg={chevronIcon} size="1.25rem" color="#aaaaaa"/>
</button>

<dialog {id} bind:this={dialogEl} class="sheet" closedby="any">
	<div class="panel">
		<header class="header">
			<h2 class="title">{title}</h2>
			<button class="close" type="button" command="close" commandfor={id} aria-label="Close">
				<Icon svg={xmarkIcon} />
			</button>
		</header>

		<ul class="options">
			{#each options as option (option.value)}
				<li>
					<button
						class="option"
						class:selected={option.value === value}
						type="button"
						onclick={() => pick(option)}
					>
						{#if option.asset}
							<Badge {...option.asset} />
						{/if}
						<span class="option-title">{option.label}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</dialog>

<style>
	@reference '../../routes/layout.css';

	/* Bottom border travels with the row so the divider survives Svelte's per-component
	   style scoping when this picker sits between page-owned form rows. */
	.field {
		@apply flex w-full cursor-pointer items-center justify-between gap-3 border-0 border-b border-[#cccccc] bg-transparent px-5 py-7 text-lg leading-none;
	}

	.value {
		@apply flex items-center gap-3 font-semibold;
	}

	.sheet {
		@apply mt-auto mb-0 w-full max-w-md border-none bg-transparent p-0;
		margin-inline: auto;
		transition:
			translate 0.2s ease,
			overlay 0.2s allow-discrete,
			display 0.2s allow-discrete;
	}

	.sheet:not([open]) {
		translate: 0 100%;
	}

	@starting-style {
		.sheet[open] {
			translate: 0 100%;
		}
	}

	.sheet::backdrop {
		@apply bg-black/40;
	}

	.panel {
		@apply w-full rounded-t-2xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom))];
	}

	.header {
		@apply flex items-center justify-between border-b border-[#cccccc] p-6;
	}

	.title {
		@apply text-2xl font-semibold;
	}

	.close {
		@apply flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent;
	}

	.options {
		@apply m-0 flex list-none flex-col divide-y divide-[#cccccc] p-0;
	}

	.option {
		@apply flex w-full cursor-pointer items-center gap-3 border-none bg-transparent p-6 text-xl leading-none font-semibold text-current;
	}

	.option:hover,
	.option:active,
	.option.selected {
		@apply bg-[#f2f2f2];
	}
</style>
