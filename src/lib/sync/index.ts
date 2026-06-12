import { browser } from '$app/environment';
import { sync } from './engine';

const INTERVAL_MS = 45_000;
const DEBOUNCE_MS = 1_500;

let interval: ReturnType<typeof setInterval> | undefined;
let debounce: ReturnType<typeof setTimeout> | undefined;

// Called by the db wrappers after a write. Coalesces bursts of mutations into a
// single sync shortly after they settle. No-op during SSR.
export function requestSync(): void {
	if (!browser) return;
	clearTimeout(debounce);
	debounce = setTimeout(() => void sync(), DEBOUNCE_MS);
}

// Start the background sync loop. Safe to call once from the root layout's onMount.
export function startSync(): void {
	if (!browser || interval) return;
	void sync();
	interval = setInterval(() => void sync(), INTERVAL_MS);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') void sync();
	});
	window.addEventListener('online', () => void sync());
}
