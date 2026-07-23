<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import Icon from './Icon.svelte';
	import balancesIcon from 'iconoir/icons/table-2-columns.svg?raw';
	import totalsIcon from 'iconoir/icons/calculator.svg?raw';
	import tagsIcon from 'iconoir/icons/label.svg?raw';
	import menuIcon from 'iconoir/icons/menu-scale.svg?raw';
	import plusIcon from 'iconoir/icons/plus.svg?raw';

	function handleAdd() {
		console.log('add tapped');
	}

	function getAriaCurrent(path: Pathname): 'page' | undefined {
		const resolved = resolve(path);
		if (page.url.pathname === resolved || page.url.pathname.startsWith(`${resolved}/`)) {
			return 'page'
		} else {
			return undefined
		}
	}
</script>

<nav class="bottom-nav" aria-label="Primary">
	<a class="tab" href={resolve('/balances')} aria-current={getAriaCurrent('/balances')}>
		<Icon svg={balancesIcon} />
		<span class="label">{m.nav_balances()}</span>
	</a>

	<a class="tab" href={resolve('/totals')} aria-current={getAriaCurrent('/totals')}>
		<Icon svg={totalsIcon} />
		<span class="label">{m.nav_totals()}</span>
	</a>

	<div class="fab-slot">
		<button class="fab" type="button" aria-label="Add" onclick={handleAdd}>
			<Icon svg={plusIcon} size="1.75rem" />
		</button>
	</div>

	<a class="tab" href={resolve('/tags')} aria-current={getAriaCurrent('/tags')}>
		<Icon svg={tagsIcon} />
		<span class="label">{m.nav_tags()}</span>
	</a>

	<a class="tab" href={resolve('/menu')} aria-current={getAriaCurrent('/menu')}>
		<Icon svg={menuIcon} />
		<span class="label">{m.nav_menu()}</span>
	</a>
</nav>

<style>
	@reference '../../routes/layout.css';

	.bottom-nav {
		@apply fixed inset-x-0 bottom-0 z-50 flex h-20 items-stretch border-t border-[#ececec] bg-white pb-[calc(1rem+env(safe-area-inset-bottom))];
	}

	.tab {
		@apply flex flex-1 flex-col items-center justify-center gap-1 border-t-3 border-transparent no-underline;
	}

	.tab[aria-current='page'] {
		@apply border-accent text-accent;
	}

	.label {
		@apply text-[0.8rem] leading-none font-semibold;
	}

	.fab-slot {
		@apply flex flex-1 items-center justify-center;
	}

	.fab {
		@apply flex size-12 cursor-pointer items-center justify-center rounded-full border-none bg-[#111] text-white;
	}
</style>
