// Preset category colors drawn from the app's theme palette (src/routes/layout.css).
// `classes` is stored verbatim on Category.classes and applied wherever a category
// is rendered. The light `highlight` swatch pairs with `text-ink`; the rest use
// `text-white` for contrast. `accent` is the matching `accent-color` utility used to
// tint that category's range slider — kept as a literal so Tailwind generates it.
export const CATEGORY_COLORS = [
	{ label: 'Blue', classes: 'bg-primary text-white', accent: 'accent-primary' },
	{ label: 'Green', classes: 'bg-accent text-white', accent: 'accent-accent' },
	{ label: 'Orange', classes: 'bg-alert text-white', accent: 'accent-alert' },
	{ label: 'Yellow', classes: 'bg-highlight text-ink', accent: 'accent-highlight' },
	{ label: 'Navy', classes: 'bg-primary-deep text-white', accent: 'accent-primary-deep' }
];

// Resolve a stored `classes` string to its slider accent utility, falling back to
// the primary accent for any unrecognized value.
export function accentForClasses(classes: string): string {
	return CATEGORY_COLORS.find((c) => c.classes === classes)?.accent ?? 'accent-primary';
}
