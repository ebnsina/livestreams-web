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
	WebhookEndpoint,
	WebhookDelivery,
	ApiKey,
	OAuthConnection,
	Member,
	Invitation,
	User,
	Org,
	AnalyticsOverview,
	StreamAnalytics,
	Paginated,
	Notification,
	SimulcastPreset
} from './types';

// Build a query string from defined params (skips undefined/empty values).
function qs(params?: Record<string, string | number | undefined>): string {
	if (!params) return '';
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== '') sp.set(k, String(v));
	}
	const s = sp.toString();
	return s ? `?${s}` : '';
}

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
	forgotPassword: (email: string) =>
		request<{ status: string }>('/v1/auth/forgot-password', {
			method: 'POST',
			body: { email },
			auth: false
		}),
	resetPassword: (token: string, new_password: string) =>
		request<{ status: string }>('/v1/auth/reset-password', {
			method: 'POST',
			body: { token, new_password },
			auth: false
		}),
	verifyEmail: (token: string) =>
		request<{ status: string }>('/v1/auth/verify-email', {
			method: 'POST',
			body: { token },
			auth: false
		}),
	resendVerification: () =>
		request<{ status: string }>('/v1/me/resend-verification', { method: 'POST' }),
	me: () => request<{ user: User; orgs: Org[]; role: string; org_id: string }>('/v1/me'),
	switchOrg: (org_id: string) =>
		request<{ access_token: string; refresh_token: string }>('/v1/me/switch-org', {
			method: 'POST',
			body: { org_id }
		}),
	updateProfile: (name: string) => request<void>('/v1/me', { method: 'PATCH', body: { name } }),
	setEmailNotifications: (enabled: boolean) =>
		request<void>('/v1/me/email-notifications', { method: 'POST', body: { enabled } }),

	// notifications
	notifications: () =>
		request<{ data: Notification[]; unread: number }>('/v1/notifications'),
	markNotificationRead: (id: string) =>
		request<void>(`/v1/notifications/${id}/read`, { method: 'POST' }),
	markAllNotificationsRead: () =>
		request<void>('/v1/notifications/read-all', { method: 'POST' }),
	changePassword: (current_password: string, new_password: string) =>
		request<void>('/v1/me/password', { method: 'POST', body: { current_password, new_password } }),

	// streams
	listStreams: (params?: { q?: string; limit?: number; offset?: number }) =>
		request<Paginated<Stream>>(`/v1/streams${qs(params)}`),
	getStream: (id: string) => request<Stream>(`/v1/streams/${id}`),
	createStream: (input: CreateStreamInput) =>
		request<Stream>('/v1/streams', { method: 'POST', body: input }),
	updateStream: (id: string, input: { name: string; description?: string; scheduled_at?: string | null }) =>
		request<Stream>(`/v1/streams/${id}`, { method: 'PATCH', body: input }),
	deleteStream: (id: string) => request<void>(`/v1/streams/${id}`, { method: 'DELETE' }),
	stopStream: (id: string) => request<void>(`/v1/streams/${id}/stop`, { method: 'POST' }),
	rotateKey: (id: string) => request<Stream>(`/v1/streams/${id}/key/rotate`, { method: 'POST' }),
	sessions: (id: string) => request<{ data: StreamSession[] }>(`/v1/streams/${id}/sessions`),

	// playback QoS
	qos: (id: string) =>
		request<{
			viewers: number;
			avg_startup_ms: number;
			total_rebuffers: number;
			avg_bitrate_kbps: number;
		}>(`/v1/streams/${id}/qos`),
	sendBeacon: (body: unknown) => {
		// fire-and-forget; no auth
		fetch(`${BASE}/v1/playback/beacon`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			keepalive: true
		}).catch(() => {});
	},

	// activity log (history)
	events: (id: string) => request<{ data: StreamEvent[] }>(`/v1/streams/${id}/events`),
	// SSE URL for live events (token in query — EventSource can't set headers)
	eventStreamUrl: (id: string) =>
		`${BASE}/v1/streams/${id}/events/stream?access_token=${encodeURIComponent(auth.token ?? '')}`,
	// SSE URL for live transcode-progress of an asset
	assetEventStreamUrl: (id: string) =>
		`${BASE}/v1/assets/${id}/events/stream?access_token=${encodeURIComponent(auth.token ?? '')}`,
	// unified live chat (YouTube + Twitch)
	chatStreamUrl: () =>
		`${BASE}/v1/chat/stream?access_token=${encodeURIComponent(auth.token ?? '')}`,
	sendChat: (text: string) =>
		request<{ sent: string[] }>('/v1/chat/send', { method: 'POST', body: { text } }),

	// analytics
	analyticsOverview: (range: '24h' | '7d' | '30d') =>
		request<AnalyticsOverview>(`/v1/analytics/overview?range=${range}`),
	streamAnalytics: (id: string, range: '24h' | '7d' | '30d') =>
		request<StreamAnalytics>(`/v1/analytics/stream?stream_id=${id}&range=${range}`),

	// jobs & org-wide activity
	jobs: () => request<{ data: Job[] }>('/v1/jobs'),
	activity: (level?: 'error') =>
		request<{ data: StreamEvent[] }>(`/v1/activity${level ? `?level=${level}` : ''}`),

	// recordings / assets
	assets: (params?: { q?: string; limit?: number; offset?: number; category?: 'recording' | 'transcode' }) =>
		request<Paginated<Asset>>(`/v1/assets${qs(params)}`),
	thumbnailUrl: (id: string) =>
		`${BASE}/v1/assets/${id}/thumbnail?access_token=${encodeURIComponent(auth.token ?? '')}`,
	storyboardUrl: (id: string) =>
		`${BASE}/v1/assets/${id}/storyboard.vtt?access_token=${encodeURIComponent(auth.token ?? '')}`,
	transcodeLogs: (id: string) =>
		request<{ status: string; logs: { stage: string; line: string; at: string }[] }>(
			`/v1/assets/${id}/transcode`
		),
	streamRecordings: (streamId: string) =>
		request<{ data: Asset[] }>(`/v1/recordings?stream_id=${streamId}`),
	assetPlayback: (id: string) =>
		request<{ url: string; kind: 'hls' | 'file'; expires_at?: string }>(
			`/v1/assets/${id}/playback`
		),
	deleteAsset: (id: string) => request<void>(`/v1/assets/${id}`, { method: 'DELETE' }),

	// VOD upload (3 steps: reserve → PUT to storage → process)
	createUpload: (input: { title?: string; filename: string; size_bytes: number }) =>
		request<{ asset_id: string; upload_url: string; expires_at: string }>('/v1/vod/uploads', {
			method: 'POST',
			body: input
		}),
	// Direct PUT to the presigned storage URL with progress (bypasses the API).
	uploadToUrl: (url: string, file: File, onProgress?: (pct: number) => void) =>
		new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', url);
			xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
			};
			xhr.onload = () =>
				xhr.status >= 200 && xhr.status < 300
					? resolve()
					: reject(new Error(`upload failed (${xhr.status})`));
			xhr.onerror = () => reject(new Error('upload failed'));
			xhr.send(file);
		}),
	processUpload: (id: string) =>
		request<Asset>(`/v1/assets/${id}/process`, { method: 'POST' }),
	retryAsset: (id: string) => request<Asset>(`/v1/assets/${id}/retry`, { method: 'POST' }),
	createClip: (id: string, input: { title?: string; start_sec: number; end_sec: number }) =>
		request<Asset>(`/v1/assets/${id}/clip`, { method: 'POST', body: input }),

	// simulcast presets
	simulcastPresets: () => request<{ data: SimulcastPreset[] }>('/v1/simulcast-presets'),
	createPreset: (input: { name: string; destination_ids: string[] }) =>
		request<SimulcastPreset>('/v1/simulcast-presets', { method: 'POST', body: input }),
	deletePreset: (id: string) => request<void>(`/v1/simulcast-presets/${id}`, { method: 'DELETE' }),
	applyPreset: (id: string, streamId: string) =>
		request<{ applied: number }>(`/v1/simulcast-presets/${id}/apply?stream_id=${streamId}`, {
			method: 'POST'
		}),

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
		}),

	// webhooks
	webhooks: () => request<{ data: WebhookEndpoint[] }>('/v1/webhooks'),
	createWebhook: (input: { url: string; events: string[] }) =>
		request<WebhookEndpoint>('/v1/webhooks', { method: 'POST', body: input }),
	deleteWebhook: (id: string) => request<void>(`/v1/webhooks/${id}`, { method: 'DELETE' }),
	webhookDeliveries: () => request<{ data: WebhookDelivery[] }>('/v1/webhook-deliveries'),
	redeliverWebhook: (id: string) =>
		request<void>(`/v1/webhook-deliveries/${id}/redeliver`, { method: 'POST' }),

	// API keys
	apiKeys: () => request<{ data: ApiKey[] }>('/v1/api-keys'),
	createApiKey: (name: string, scopes: string[]) =>
		request<ApiKey>('/v1/api-keys', { method: 'POST', body: { name, scopes } }),
	revokeApiKey: (id: string) => request<void>(`/v1/api-keys/${id}`, { method: 'DELETE' }),

	// OAuth account linking
	oauthProviders: () => request<{ providers: string[] }>('/v1/oauth/providers'),
	oauthProviderConfigs: () =>
		request<{
			data: { platform: string; client_id: string; configured: boolean; redirect_uri: string }[];
		}>('/v1/oauth/provider-configs'),
	setOauthProviderConfig: (input: { platform: string; client_id: string; client_secret: string }) =>
		request<void>('/v1/oauth/provider-configs', { method: 'POST', body: input }),
	deleteOauthProviderConfig: (platform: string) =>
		request<void>(`/v1/oauth/provider-configs/${platform}`, { method: 'DELETE' }),
	oauthConnections: () => request<{ data: OAuthConnection[] }>('/v1/oauth/connections'),
	oauthAuthorize: (platform: string) =>
		request<{ redirect_url: string }>(`/v1/oauth/${platform}/authorize`),
	importStreamKey: (id: string) =>
		request<{ id: string; platform: string; name: string; url: string; updated: boolean }>(
			`/v1/oauth/connections/${id}/import-key`,
			{ method: 'POST' }
		),
	deleteOauthConnection: (id: string) =>
		request<void>(`/v1/oauth/connections/${id}`, { method: 'DELETE' }),

	// team / membership
	teamMembers: () => request<{ data: Member[] }>('/v1/team/members'),
	teamInvitations: () => request<{ data: Invitation[] }>('/v1/team/invitations'),
	createInvitation: (email: string, role: string) =>
		request<Invitation>('/v1/team/invitations', { method: 'POST', body: { email, role } }),
	revokeInvitation: (id: string) =>
		request<void>(`/v1/team/invitations/${id}`, { method: 'DELETE' }),
	acceptInvitation: (token: string) =>
		request<void>('/v1/team/invitations/accept', { method: 'POST', body: { token } })
};
