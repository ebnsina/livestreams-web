// Typed HTTP client for the livestreams-backend API.
// Reads the access token from the auth store and surfaces problem+json errors.

import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { auth } from './auth.svelte';
import type {
	AuthResponse,
	CreateStreamInput,
	Stream,
	StreamSession,
	StreamEvent,
	Job,
	Asset,
	Destination,
	User,
	Org
} from './types';

const BASE = PUBLIC_API_BASE_URL ?? 'http://localhost:8085';

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

interface RequestOpts {
	method?: string;
	body?: unknown;
	auth?: boolean; // attach bearer token (default true)
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
	const { method = 'GET', body, auth: withAuth = true } = opts;
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (withAuth && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;

	const res = await fetch(`${BASE}${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body)
	});

	if (res.status === 204) return undefined as T;

	const text = await res.text();
	const data = text ? JSON.parse(text) : null;

	if (!res.ok) {
		const detail = data?.detail || data?.title || res.statusText;
		if (res.status === 401) auth.clear();
		throw new ApiError(res.status, detail);
	}
	return data as T;
}

export const api = {
	// auth
	register: (input: { email: string; password: string; name: string; org_name: string }) =>
		request<AuthResponse>('/v1/auth/register', { method: 'POST', body: input, auth: false }),
	login: (input: { email: string; password: string }) =>
		request<AuthResponse>('/v1/auth/login', { method: 'POST', body: input, auth: false }),
	me: () => request<{ user: User; orgs: Org[] }>('/v1/me'),

	// streams
	listStreams: () => request<{ data: Stream[] }>('/v1/streams'),
	getStream: (id: string) => request<Stream>(`/v1/streams/${id}`),
	createStream: (input: CreateStreamInput) =>
		request<Stream>('/v1/streams', { method: 'POST', body: input }),
	deleteStream: (id: string) => request<void>(`/v1/streams/${id}`, { method: 'DELETE' }),
	stopStream: (id: string) => request<void>(`/v1/streams/${id}/stop`, { method: 'POST' }),
	rotateKey: (id: string) => request<Stream>(`/v1/streams/${id}/key/rotate`, { method: 'POST' }),
	sessions: (id: string) => request<{ data: StreamSession[] }>(`/v1/streams/${id}/sessions`),

	// activity log (history)
	events: (id: string) => request<{ data: StreamEvent[] }>(`/v1/streams/${id}/events`),
	// SSE URL for live events (token in query — EventSource can't set headers)
	eventStreamUrl: (id: string) =>
		`${BASE}/v1/streams/${id}/events/stream?access_token=${encodeURIComponent(auth.token ?? '')}`,

	// jobs & org-wide activity
	jobs: () => request<{ data: Job[] }>('/v1/jobs'),
	activity: (level?: 'error') =>
		request<{ data: StreamEvent[] }>(`/v1/activity${level ? `?level=${level}` : ''}`),

	// recordings / assets
	assets: () => request<{ data: Asset[] }>('/v1/assets'),
	streamRecordings: (streamId: string) =>
		request<{ data: Asset[] }>(`/v1/recordings?stream_id=${streamId}`),
	assetPlayback: (id: string) =>
		request<{ url: string; expires_at: string }>(`/v1/assets/${id}/playback`),

	// multistream destinations
	destinations: () => request<{ data: Destination[] }>('/v1/destinations'),
	createDestination: (input: { platform: string; name: string; url: string; stream_key: string }) =>
		request<Destination>('/v1/destinations', { method: 'POST', body: input }),
	deleteDestination: (id: string) => request<void>(`/v1/destinations/${id}`, { method: 'DELETE' }),
	streamDestinations: (streamId: string) =>
		request<{ data: Destination[] }>(`/v1/stream-destinations?stream_id=${streamId}`),
	toggleStreamDestination: (streamId: string, destId: string, enabled: boolean) =>
		request<void>(`/v1/stream-destinations?stream_id=${streamId}&dest_id=${destId}`, {
			method: 'PUT',
			body: { enabled }
		})
};
