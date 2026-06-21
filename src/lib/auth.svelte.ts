// Auth state as a runes-based singleton. Persists tokens to localStorage so a
// page reload keeps the session.

import type { User } from './types';

const TOKEN_KEY = 'ls.access_token';
const REFRESH_KEY = 'ls.refresh_token';

class Auth {
	token = $state<string | null>(null);
	refreshToken = $state<string | null>(null);
	user = $state<User | null>(null);
	role = $state<string>(''); // role in the active org
	activeOrgId = $state<string>('');

	constructor() {
		if (typeof localStorage !== 'undefined') {
			this.token = localStorage.getItem(TOKEN_KEY);
			this.refreshToken = localStorage.getItem(REFRESH_KEY);
		}
	}

	get isAuthenticated() {
		return !!this.token;
	}

	get canWrite() {
		return this.role !== 'viewer';
	}

	get isAdmin() {
		return this.role === 'owner' || this.role === 'admin';
	}

	// update just the tokens (e.g. after switching org), keeping the user
	setTokens(token: string, refreshToken: string) {
		this.token = token;
		this.refreshToken = refreshToken;
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem(REFRESH_KEY, refreshToken);
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
