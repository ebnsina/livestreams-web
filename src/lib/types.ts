// Types mirroring the livestreams-backend API DTOs.

export type StreamStatus = 'idle' | 'live' | 'errored';
export type IngestProtocol = 'rtmp' | 'srt' | 'whip';
export type LatencyMode = 'standard' | 'low' | 'ultra_low';

export interface User {
	id: string;
	email: string;
	name: string;
	email_notifications?: boolean;
	email_verified?: boolean;
}

export interface Notification {
	id: string;
	type: string;
	title: string;
	body: string;
	stream_id?: string;
	read: boolean;
	created_at: string;
}

export interface Org {
	id: string;
	name: string;
	slug: string;
	role: string;
}

export interface AuthResponse {
	user: User;
	access_token: string;
	refresh_token: string;
}

export interface Ingest {
	protocol: string;
	rtmp_url?: string;
	srt_host?: string;
	whip_url?: string;
	stream_key: string;
}

export interface Stream {
	id: string;
	name: string;
	description: string;
	status: StreamStatus;
	ingest_protocol: IngestProtocol;
	latency_mode: LatencyMode;
	recording_enabled: boolean;
	protected?: boolean;
	ingest?: Ingest;
	playback_url: string;
	scheduled_at?: string | null;
	created_at: string;
}

export interface StreamSession {
	id: string;
	status: string;
	started_at: string | null;
	ended_at: string | null;
	peak_viewers: number;
}

export type EventLevel = 'info' | 'warn' | 'error';

export interface StreamEvent {
	id: string;
	stream_id: string;
	session_id?: string;
	type: string;
	level: EventLevel;
	message: string;
	data?: Record<string, unknown>;
	created_at: string;
}

export interface AnalyticsPoint {
	t: string;
	viewers: number;
	bitrate_kbps: number;
	rebuffers: number;
}

export interface AnalyticsOverview {
	range: string;
	unit: string;
	summary: {
		streams: number;
		live_now: number;
		recordings: number;
		vod: number;
		storage_bytes: number;
		peak_viewers: number;
		avg_startup_ms: number;
		total_rebuffers: number;
	};
	series: AnalyticsPoint[];
}

export interface Paginated<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}

export interface StreamAnalytics {
	range: string;
	unit: string;
	summary: {
		peak_viewers: number;
		avg_startup_ms: number;
		total_rebuffers: number;
	};
	series: AnalyticsPoint[];
}

export interface Asset {
	id: string;
	title: string;
	type: string;
	status: string;
	duration_sec: number;
	size_bytes: number;
	error?: string;
	thumbnail?: boolean;
	storyboard?: boolean;
	caption_status?: string; // none | processing | ready | errored
	protected?: boolean;
	created_at: string;
}

export interface SimulcastPreset {
	id: string;
	name: string;
	destination_ids: string[];
}

export interface Destination {
	id: string;
	platform: string;
	name: string;
	url: string;
	created_at: string;
	attached?: boolean;
	enabled?: boolean;
	relay_state?: string; // relaying | stopped | error
}

export interface ApiKey {
	id: string;
	name: string;
	prefix: string;
	scopes: string[];
	last_used_at?: string;
	created_at: string;
	key?: string; // full key, returned once on create
}

export interface Member {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface Invitation {
	id: string;
	email: string;
	role: string;
	created_at: string;
	token?: string; // returned once on create
}

export interface OAuthConnection {
	id: string;
	platform: string;
	account_name: string;
	status: string;
	created_at: string;
}

export interface WebhookEndpoint {
	id: string;
	url: string;
	events: string[];
	enabled: boolean;
	created_at: string;
	secret?: string; // returned once on create
}

export interface WebhookDelivery {
	id: string;
	event_type: string;
	status: string;
	attempts: number;
	response_code?: number;
	error?: string;
	created_at: string;
}

export interface JobError {
	at: string;
	error: string;
}

export interface Job {
	id: number;
	state: string;
	kind: string;
	stream_id?: string;
	session_id?: string;
	attempt: number;
	max_attempts: number;
	errors: JobError[];
	created_at: string;
	attempted_at?: string;
	finalized_at?: string;
}

export interface CreateStreamInput {
	name: string;
	description?: string;
	ingest_protocol?: IngestProtocol;
	latency_mode?: LatencyMode;
	recording_enabled?: boolean;
	scheduled_at?: string | null;
}
