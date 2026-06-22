// App-wide toast notifications. Use `toast.success(msg)` / `toast.error(msg)` /
// `toast.info(msg)` from anywhere; render <Toaster /> once in the root layout.

type Kind = 'success' | 'error' | 'info';
export type Toast = { id: number; kind: Kind; message: string };

let items = $state<Toast[]>([]);
let seq = 0;

export const toasts = {
	get items() {
		return items;
	},
	dismiss(id: number) {
		items = items.filter((t) => t.id !== id);
	}
};

function push(kind: Kind, message: string) {
	const id = ++seq;
	items = [...items, { id, kind, message }];
	setTimeout(() => toasts.dismiss(id), 4500);
}

export const toast = {
	success: (m: string) => push('success', m),
	error: (m: string) => push('error', m),
	info: (m: string) => push('info', m)
};
