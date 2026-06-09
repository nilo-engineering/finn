<script lang="ts">
	type Option = { name: string; label: string };

	type Props = {
		options: Option[];
		value: string;
		onChange?: (value: string) => void;
	};

	let { options, value = $bindable(), onChange }: Props = $props();

	const SIZE = 240;
	const CENTER = SIZE / 2;
	const OUTER_R = 100;
	const INNER_R = 30;
	const LABEL_R = 66;
	const DEADZONE = 30;

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
		centerEl.focus();
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
		if (target && target !== value) {
			value = target;
			onChange?.(target);
		}
		pressed = false;
		target = null;
		activePointerId = null;
		centerEl?.blur()
	}

	function cancel() {
		pressed = false;
		target = null;
		activePointerId = null;
		centerEl?.blur()
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== activePointerId) return;
		commit();
	}

	function onPointerCancel(e: PointerEvent) {
		if (e.pointerId !== activePointerId) return;
		cancel();
	}

	function cycleTarget(dir: -1 | 1) {
		const baseIdx = target
			? segments.findIndex((s) => s.name === target)
			: segments.findIndex((s) => s.name === value);
		const start = baseIdx === -1 ? 0 : baseIdx;
		const next = (start + dir + segments.length) % segments.length;
		target = segments[next].name;
	}

	function stepValue(dir: -1 | 1) {
		const currentIdx = segments.findIndex((s) => s.name === value);
		const start = currentIdx === -1 ? 0 : currentIdx;
		const next = Math.max(0, Math.min(segments.length - 1, start + dir));
		const newValue = segments[next].name;
		if (newValue !== value) {
			value = newValue;
			onChange?.(newValue);
		}
	}

	function isSpace(e: KeyboardEvent) {
		return e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
	}

	function isTypingTarget(e: KeyboardEvent) {
		const t = e.target as HTMLElement | null;
		if (!t) return false;
		const tag = t.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
	}

	function onWindowKeyDown(e: KeyboardEvent) {
		if (isTypingTarget(e)) return;

		if (isSpace(e)) {
			e.preventDefault();
			if (!pressed && !e.repeat) {
				pressed = true;
				target = null;
				centerEl?.focus();
			}
			return;
		}

		if (pressed) {
			if (e.key === 'Escape') {
				e.preventDefault();
				cancel();
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				e.preventDefault();
				cycleTarget(e.key === 'ArrowLeft' ? -1 : 1);
			}
		}
	}

	function onWindowKeyUp(e: KeyboardEvent) {
		if (isTypingTarget(e)) return;
		if (isSpace(e) && pressed) {
			e.preventDefault();
			commit();
		}
	}

	function onCenterKeyDown(e: KeyboardEvent) {
		if (!pressed && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
			e.preventDefault();
			stepValue(e.key === 'ArrowLeft' ? -1 : 1);
		}
	}

	function rand(seed: number) {
		const x = Math.sin(seed * 9301 + 49297) * 233280;
		return x - Math.floor(x);
	}

	function jit(seed: number, amp: number) {
		return (rand(seed) - 0.5) * 2 * amp;
	}

	function wobblyCircle(r: number, seed: number) {
		const segs = 16;
		const amp = 1.6;
		const k = (4 / 3) * Math.tan(Math.PI / (2 * segs));
		const pts: { x: number; y: number; a: number; rr: number }[] = [];
		for (let i = 0; i < segs; i++) {
			const a = (i / segs) * 2 * Math.PI;
			const rr = r + jit(seed + i * 3.1, amp);
			pts.push({
				x: CENTER + Math.cos(a) * rr,
				y: CENTER + Math.sin(a) * rr,
				a,
				rr
			});
		}
		let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
		for (let i = 0; i < segs; i++) {
			const p0 = pts[i];
			const p1 = pts[(i + 1) % segs];
			const c1x = p0.x - Math.sin(p0.a) * p0.rr * k + jit(seed + i + 100, amp);
			const c1y = p0.y + Math.cos(p0.a) * p0.rr * k + jit(seed + i + 200, amp);
			const c2x = p1.x + Math.sin(p1.a) * p1.rr * k + jit(seed + i + 300, amp);
			const c2y = p1.y - Math.cos(p1.a) * p1.rr * k + jit(seed + i + 400, amp);
			d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
		}
		return d + ' Z';
	}

	function wobblySpoke(angle: number, innerR: number, outerR: number, seed: number) {
		const x1 = CENTER + Math.cos(angle) * innerR;
		const y1 = CENTER + Math.sin(angle) * innerR;
		const x2 = CENTER + Math.cos(angle) * outerR;
		const y2 = CENTER + Math.sin(angle) * outerR;
		const nx = -Math.sin(angle);
		const ny = Math.cos(angle);
		const c1x = x1 + (x2 - x1) * 0.33 + nx * jit(seed, 2.5);
		const c1y = y1 + (y2 - y1) * 0.33 + ny * jit(seed, 2.5);
		const c2x = x1 + (x2 - x1) * 0.67 + nx * jit(seed + 1, 2.5);
		const c2y = y1 + (y2 - y1) * 0.67 + ny * jit(seed + 1, 2.5);
		return `M ${x1.toFixed(2)} ${y1.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`;
	}

	function wedgePath(startAngle: number, endAngle: number) {
		const x1 = CENTER + Math.cos(startAngle) * OUTER_R;
		const y1 = CENTER + Math.sin(startAngle) * OUTER_R;
		const x2 = CENTER + Math.cos(endAngle) * OUTER_R;
		const y2 = CENTER + Math.sin(endAngle) * OUTER_R;
		const x3 = CENTER + Math.cos(endAngle) * INNER_R;
		const y3 = CENTER + Math.sin(endAngle) * INNER_R;
		const x4 = CENTER + Math.cos(startAngle) * INNER_R;
		const y4 = CENTER + Math.sin(startAngle) * INNER_R;
		let sweep = endAngle - startAngle;
		if (sweep < 0) sweep += 2 * Math.PI;
		const largeArc = sweep > Math.PI ? 1 : 0;
		return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
	}

	const seed = $derived(options.length * 7 + 13);
	const circleD = $derived(wobblyCircle(OUTER_R, seed));
	const spokes = $derived(
		segments.map((s, i) => {
			const next = segments[(i + 1) % segments.length];
			let mid = (s.angle + next.angle) / 2;
			if (next.angle < s.angle) mid = (s.angle + next.angle + 2 * Math.PI) / 2;
			return wobblySpoke(mid, INNER_R, OUTER_R, seed + i * 11);
		})
	);

	const targetHighlight = $derived.by(() => {
		if (!target) return '';
		const i = segments.findIndex((s) => s.name === target);
		if (i < 0) return '';
		const half = Math.PI / segments.length;
		return wedgePath(segments[i].angle - half, segments[i].angle + half);
	});

	const currentLabel = $derived(options.find((o) => o.name === value)?.label ?? '');
	const targetLabel = $derived(
		target ? (options.find((o) => o.name === target)?.label ?? '') : ''
	);
	const centerLabel = $derived(
		pressed ? targetLabel || 'release' : currentLabel || 'hold'
	);
</script>

<svelte:window onkeydown={onWindowKeyDown} onkeyup={onWindowKeyUp} />

<div
	class="relative mx-auto"
	style="width: {SIZE}px; height: {SIZE}px;"
	aria-label="Selector"
>
	<svg
		viewBox="0 0 {SIZE} {SIZE}"
		class="text-primary absolute inset-0 h-full w-full"
		aria-hidden="true"
	>
		<g class="wheel-layer" class:active={pressed}>
			{#if targetHighlight}
				<path d={targetHighlight} class="fill-highlight" fill-opacity="0.55" />
			{/if}
			<path
				d={circleD}
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			{#each spokes as d, i (i)}
				<path
					{d}
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
				/>
			{/each}
			{#each segments as seg (seg.name)}
				{@const lx = CENTER + Math.cos(seg.angle) * LABEL_R}
				{@const ly = CENTER + Math.sin(seg.angle) * LABEL_R}
				<text
					x={lx}
					y={ly}
					text-anchor="middle"
					dominant-baseline="middle"
					class="fill-primary-deep text-[13px]"
					class:font-semibold={target === seg.name}
				>
					{seg.label}
				</text>
			{/each}
		</g>
	</svg>

	<button
		bind:this={centerEl}
		type="button"
		aria-label="Selector, current: {currentLabel || 'none'}"
		aria-haspopup="true"
		aria-expanded={pressed}
		aria-keyshortcuts="Space ArrowLeft ArrowRight Escape"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerCancel}
		onkeydown={onCenterKeyDown}
		class="border-primary text-primary-deep outline-primary absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[2.5px] bg-white text-sm font-medium shadow-sm transition-transform duration-150 select-none
			{pressed ? 'scale-95' : 'hover:scale-105'}"
		style="touch-action: none;"
	>
		{centerLabel}
	</button>
</div>

<style>
	.wheel-layer {
		opacity: 0;
		transform: scale(0.45);
		transform-origin: 50% 50%;
		transform-box: fill-box;
		transition:
			opacity 160ms ease-out,
			transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
		pointer-events: none;
	}
	.wheel-layer.active {
		opacity: 1;
		transform: scale(1);
	}
</style>
