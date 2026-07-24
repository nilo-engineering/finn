// A single transient message shown by <Toast>. It lives outside the page tree so it
// survives the navigation that a successful form submit triggers.
export const toast = $state<{ message: string | null }>({ message: null });

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, ms = 3000): void {
	toast.message = message;
	clearTimeout(timer);
	timer = setTimeout(() => {
		toast.message = null;
	}, ms);
}
