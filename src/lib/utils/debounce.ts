export type Debounced<A extends unknown[]> = {
	(...args: A): void;
	flush: () => void;
	cancel: () => void;
};

export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	delay: number
): Debounced<A> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: A | undefined;

	function debounced(...args: A) {
		pending = args;
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			const args = pending!;
			pending = undefined;
			fn(...args);
		}, delay);
	}

	debounced.flush = function flush() {
		if (pending === undefined) return;
		clearTimeout(timer);
		timer = undefined;
		const args = pending;
		pending = undefined;
		fn(...args);
	};

	debounced.cancel = function cancel() {
		clearTimeout(timer);
		timer = undefined;
		pending = undefined;
	};

	return debounced;
}
