<script lang="ts">
	type Option = { name: string; label: string };

	type Props = {
		options: Option[];
		value: string;
	};

	let { options, value = $bindable() }: Props = $props();

	const RADIUS = 88;
	const DEADZONE = 24;

	const segments = $derived(
		options.map((opt, i) => ({
			...opt,
			angle: -Math.PI / 2 + (i * 2 * Math.PI) / options.length
		}))
	);

	let pressed = $state(false);
	let target = $state<string | null>(null);
	let activePointerId: number | null = null;
	let centerEl: HTMLButtonElement | undefined;

	function nearestSegment(dx: number, dy: number) {
		const angle = Math.atan2(dy, dx);
		let best = segments[0];
		let bestDiff = Infinity;
		for (const s of segments) {
			let d = Math.abs(angle - s.angle);
			if (d > Math.PI) d = 2 * Math.PI - d;
			if (d < bestDiff) {
				bestDiff = d;
				best = s;
			}
		}
		return best;
	}

	function pointerOffset(e: PointerEvent) {
		if (!centerEl) return { dx: 0, dy: 0 };
		const rect = centerEl.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		return { dx: e.clientX - cx, dy: e.clientY - cy };
	}

	function onPointerDown(e: PointerEvent) {
		if (!centerEl) return;
		centerEl.setPointerCapture(e.pointerId);
		activePointerId = e.pointerId;
		pressed = true;
		target = null;
		e.preventDefault();
	}

	function onPointerMove(e: PointerEvent) {
		if (!pressed || e.pointerId !== activePointerId) return;
		const { dx, dy } = pointerOffset(e);
		if (Math.hypot(dx, dy) < DEADZONE) {
			target = null;
		} else {
			target = nearestSegment(dx, dy).name;
		}
	}

	function commit() {
		if (target) value = target;
		pressed = false;
		target = null;
		activePointerId = null;
	}

	function cancel() {
		pressed = false;
		target = null;
		activePointerId = null;
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== activePointerId) return;
		commit();
	}

	function onPointerCancel(e: PointerEvent) {
		if (e.pointerId !== activePointerId) return;
		cancel();
	}

	function onKeyDown(e: KeyboardEvent) {
		if (pressed && e.key === 'Escape') {
			e.preventDefault();
			cancel();
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<div
	class="relative mx-auto"
	style="width: {RADIUS * 2 + 80}px; height: {RADIUS * 2 + 80}px;"
	role="radiogroup"
	aria-label="Period"
>
	<div
		class="border-ink/10 absolute inset-6 rounded-full border-2 border-dashed"
		aria-hidden="true"
	></div>

	{#each segments as seg (seg.name)}
		{@const x = Math.cos(seg.angle) * RADIUS}
		{@const y = Math.sin(seg.angle) * RADIUS}
		{@const isSelected = value === seg.name}
		{@const isTarget = pressed && target === seg.name}
		<button
			type="button"
			role="radio"
			aria-checked={isSelected}
			onclick={() => (value = seg.name)}
			class="absolute top-1/2 left-1/2 flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-colors duration-150
				{isTarget
				? 'bg-highlight text-ink scale-110'
				: isSelected
					? 'bg-primary text-white'
					: 'bg-ink/5 text-ink/70'}"
			style="transform: translate(-50%, -50%) translate({x}px, {y}px) {isTarget
				? 'scale(1.1)'
				: ''};"
		>
			{seg.label}
		</button>
	{/each}

	<button
		bind:this={centerEl}
		type="button"
		aria-label="Hold and drag to choose a period"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerCancel}
		class="bg-primary-deep absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold text-white shadow-md transition-transform duration-150 select-none
			{pressed ? 'scale-95' : 'hover:scale-105'}"
		style="touch-action: none;"
	>
		{pressed ? 'Release' : 'Hold'}
	</button>
</div>
