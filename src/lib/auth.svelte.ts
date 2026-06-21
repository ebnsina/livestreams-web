// Auth state as a runes-based singleton. Persists tokens to localStorage so a
// page reload keeps the session.

import type { User } from './types';

const TOKEN_KEY = 'ls.access_token';
const REFRESH_KEY = 'ls.refresh_token';

class Auth {
	token = $state<string | null>(null);
	refreshToken = $state<string | null>(null);
	user = $state<User | null>(null);

	constructor() {
		if (typeof localStorage !== 'undefined') {
			this.token = localStorage.getItem(TOKEN_KEY);
			this.refreshToken = localStorage.getItem(REFRESH_KEY);
		}
	}

	get isAuthenticated() {
		return !!this.token;
	}

	set(token: string, refreshToken: string, user: User) {
		this.token = token;
		this.refreshToken = refreshToken;
		this.user = user;
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem(REFRESH_KEY, refreshToken);
	}

	setUser(user: User) {
		this.user = user;
	}

	clear() {
		this.token = null;
		this.refreshToken = null;
		this.user = null;
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(REFRESH_KEY);
	}
}

export const auth = new Auth();
