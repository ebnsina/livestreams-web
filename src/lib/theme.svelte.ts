// Light/dark theme as a runes singleton. Light is the default (brand kit);
// dark is opt-in. Persists to localStorage and toggles the `.dark` class on
// <html>.

type Mode = 'dark' | 'light';
const KEY = 'ls.theme';

class Theme {
	mode = $state<Mode>('light');

	init() {
		if (typeof localStorage === 'undefined') return;
		const saved = localStorage.getItem(KEY) as Mode | null;
		const prefersDark =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
		this.mode = saved ?? (prefersDark ? 'dark' : 'light');
		this.apply();
	}

	toggle() {
		this.mode = this.mode === 'dark' ? 'light' : 'dark';
		localStorage.setItem(KEY, this.mode);
		this.apply();
	}

	private apply() {
		document.documentElement.classList.toggle('dark', this.mode === 'dark');
	}
}

export const theme = new Theme();
