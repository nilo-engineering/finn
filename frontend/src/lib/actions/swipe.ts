import type { Action } from 'svelte/action';

type SwipeOptions = {
	onLeft?: () => void;
	onRight?: () => void;
	threshold?: number;
};

export const swipe: Action<HTMLElement, SwipeOptions> = (node, options) => {
	let opts = options ?? {};
	let startX = 0;
	let startY = 0;
	let startT = 0;
	let tracking = false;

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType !== 'touch') return;
		startX = e.clientX;
		startY = e.clientY;
		startT = e.timeStamp;
		tracking = true;
	}

	function onPointerUp(e: PointerEvent) {
		if (!tracking) return;
		tracking = false;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const dt = e.timeStamp - startT;
		const threshold = opts.threshold ?? 50;
		if (dt > 600) return;
		if (Math.abs(dx) < threshold) return;
		if (Math.abs(dy) > threshold / 2) return;
		if (dx < 0) opts.onLeft?.();
		else opts.onRight?.();
	}

	function onPointerCancel() {
		tracking = false;
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerCancel);

	return {
		update(next: SwipeOptions) {
			opts = next ?? {};
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerCancel);
		}
	};
};
