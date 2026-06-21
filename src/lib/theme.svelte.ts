// Light/dark theme as a runes singleton. Persists to localStorage and toggles
// the `.light` class on <html> (dark is the default).

type Mode = 'dark' | 'light';
const KEY = 'ls.theme';

class Theme {
	mode = $state<Mode>('dark');

	init() {
		if (typeof localStorage === 'undefined') return;
		const saved = localStorage.getItem(KEY) as Mode | null;
		const prefersLight =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches;
		this.mode = saved ?? (prefersLight ? 'light' : 'dark');
		this.apply();
	}

	toggle() {
		this.mode = this.mode === 'dark' ? 'light' : 'dark';
		localStorage.setItem(KEY, this.mode);
		this.apply();
	}

	private apply() {
		document.documentElement.classList.toggle('light', this.mode === 'light');
	}
}

export const theme = new Theme();
