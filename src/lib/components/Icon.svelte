<script lang="ts">
	interface Props {
		/** Raw iconoir SVG markup (import with `?raw`). */
		svg: string;
		/** CSS length for the square icon box. */
		size?: string;
		/** Stroke width baked into the mask (iconoir ships at 1.5). */
		strokeWidth?: number;
		/** Icon color; defaults to the inherited text color. */
		color?: string;
	}

	let { svg, size = '1.5rem', strokeWidth = 2, color = 'currentColor' }: Props = $props();

	// Mask can't be restyled via CSS, so bake the stroke width into the SVG markup.
	const src = $derived(
		'data:image/svg+xml,' +
			encodeURIComponent(svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`))
	);
</script>

<span
	class="icon"
	style:--icon-size={size}
	style:--icon-src={`url("${src}")`}
	style:color
	aria-hidden="true"
></span>

<style>
	@reference '../../routes/layout.css';

	/* Rendered as a mask so `currentColor` drives the icon color (recolors iconoir's
	   stroke icons) without `{@html}`. Size is dynamic, so it stays raw. */
	.icon {
		@apply inline-block shrink-0 bg-current;
		width: var(--icon-size);
		height: var(--icon-size);
		-webkit-mask: var(--icon-src) center / contain no-repeat;
		mask: var(--icon-src) center / contain no-repeat;
	}
</style>
