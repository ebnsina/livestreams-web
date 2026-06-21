// Types mirroring the livestreams-backend API DTOs.

export type StreamStatus = 'idle' | 'live' | 'errored';
export type IngestProtocol = 'rtmp' | 'srt' | 'whip';
export type LatencyMode = 'standard' | 'low' | 'ultra_low';

export interface User {
	id: string;
	email: string;
	name: string;
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
	ingest?: Ingest;
	playback_url: string;
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

export interface Asset {
	id: string;
	title: string;
	type: string;
	status: string;
	duration_sec: number;
	size_bytes: number;
	created_at: string;
}

export interface Destination {
	id: string;
	platform: string;
	name: string;
	url: string;
	created_at: string;
	attached?: boolean;
	enabled?: boolean;
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
}
