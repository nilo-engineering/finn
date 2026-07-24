<script lang="ts" module>
	export interface BadgeProps {
		/** Circle background color (any CSS color). */
		backgroundColor: string;
		/** Icon (foreground) color. */
		color: string;
		/** Raw iconoir SVG markup (import with `?raw`). */
		icon: string;
	}
</script>

<script lang="ts">
	import Icon from './Icon.svelte';

	let { backgroundColor, color, icon }: BadgeProps = $props();
</script>

<span class="badge" style:background-color={backgroundColor} style:color>
	<Icon svg={icon} size="0.8rem" strokeWidth={3} />
</span>

<style>
	@reference '../../routes/layout.css';

	.badge {
		@apply flex size-6 shrink-0 items-center justify-center rounded-full;
	}
</style>
