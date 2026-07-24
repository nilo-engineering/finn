<script lang="ts" module>
	import type { BadgeProps } from './Badge.svelte';

	export interface Option {
		label: string;
		/** Optional leading badge. */
		asset?: BadgeProps;
		href: ResolvedPathname;
	}
</script>

<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import Icon from './Icon.svelte';
	import Badge from './Badge.svelte';
	import xmarkIcon from 'iconoir/icons/regular/xmark.svg?raw';
	import type { ResolvedPathname } from '$app/types';

	interface Props {
		/** Referenced by an invoker button's `commandfor` to open the sheet. */
		id: string;
		title: string;
		options: Option[];
	}

	let { id, title, options }: Props = $props();

	let dialogEl: HTMLDialogElement;

	afterNavigate(() => dialogEl.close());
</script>

<dialog {id} bind:this={dialogEl} class="sheet" closedby="any">
	<div class="panel">
		<header class="header">
			<h2 class="title">{title}</h2>
			<button class="close" type="button" command="close" commandfor={id} aria-label="Close">
				<Icon svg={xmarkIcon} />
			</button>
		</header>

		<ul class="options">
			{#each options as option, i (i)}
				<li>
					<a class="option" href={option.href} data-sveltekit-noscroll>
						{#if option.asset}
							<Badge {...option.asset} />
						{/if}
						<span class="option-label">{option.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</dialog>

<style>
	@reference '../../routes/layout.css';

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
		@apply flex w-full cursor-pointer items-center gap-3 p-6 text-lg text-current no-underline;
	}

	.option:hover,
	.option:active {
		@apply bg-[#f2f2f2];
	}

	.option-label {
		@apply leading-none font-semibold text-xl;
	}
</style>
