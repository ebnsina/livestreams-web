// Playback tracker — a Mux-Data / Vimeo-style "view" collector built into the
// player. One instance == one *view* (a single watch session of a stream/VOD).
// It accumulates engagement + quality-of-experience metrics and ships them to
// the backend as it goes: a `start` ping, periodic `heartbeat`s (which also
// drive concurrent-viewer and watch-time tracking), and a final `end` flush
// sent via `navigator.sendBeacon` so it survives the page unloading.
//
// The viewer_id is stable across views (localStorage); the view_id is unique
// per instance. No third-party libraries — UA parsing is done inline.
import { api } from '$lib/api';

const VIEWER_KEY = 'ls_viewer_id';

function uuid(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
}

function viewerId(): string {
	if (typeof localStorage === 'undefined') return uuid();
	let id = localStorage.getItem(VIEWER_KEY);
	if (!id) {
		id = uuid();
		try {
			localStorage.setItem(VIEWER_KEY, id);
		} catch {
			/* private mode — fall back to a per-view id */
		}
	}
	return id;
}

// Best-effort device/OS/browser from the UA string. Coarse on purpose — these
// are analytics dimensions, not feature gates.
function detectEnv(): { browser: string; os: string; device: string } {
	if (typeof navigator === 'undefined') return { browser: '', os: '', device: '' };
	const ua = navigator.userAgent;
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\/|Opera/.test(ua)
			? 'Opera'
			: /Chrome\//.test(ua)
				? 'Chrome'
				: /Firefox\//.test(ua)
					? 'Firefox'
					: /Safari\//.test(ua)
						? 'Safari'
						: 'Other';
	const os = /Windows/.test(ua)
		? 'Windows'
		: /Android/.test(ua)
			? 'Android'
			: /iPhone|iPad|iPod/.test(ua)
				? 'iOS'
				: /Mac OS X/.test(ua)
					? 'macOS'
					: /Linux/.test(ua)
						? 'Linux'
						: 'Other';
	const device = /iPad|Tablet/.test(ua)
		? 'tablet'
		: /Mobi|Android|iPhone|iPod/.test(ua)
			? 'mobile'
			: 'desktop';
	return { browser, os, device };
}

export type TrackerOpts = {
	streamId: string;
	streamType: 'live' | 'vod';
	player: string; // 'hls.js' | 'native'
	playerVersion?: string;
};

export class PlaybackTracker {
	private viewId = uuid();
	private viewer = viewerId();
	private env = detectEnv();
	private opts: TrackerOpts;

	// engagement / QoE accumulators
	private startedAt = 0; // perf clock at view start
	private startupMs = 0; // time to first frame
	private watchMs = 0; // cumulative playing time
	private playingSince = 0; // perf clock when playback (re)started, 0 if not playing
	private rebuffers = 0;
	private rebufferMs = 0;
	private rebufferStart = 0;
	private seeks = 0;
	private maxBitrateKbps = 0;
	private bitrateKbps = 0; // current rendition
	private videoHeight = 0;
	private errored = false;
	private errorMessage = '';
	private completed = false;

	private heartbeat: ReturnType<typeof setInterval> | null = null;
	private done = false;
	private onHide = () => this.flush('heartbeat');

	constructor(opts: TrackerOpts) {
		this.opts = opts;
	}

	start() {
		if (!this.opts.streamId) return;
		this.startedAt = performance.now();
		this.send('start');
		this.heartbeat = setInterval(() => this.flush('heartbeat'), 10000);
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', this.onHide);
			window.addEventListener('pagehide', this.endNow);
		}
	}

	// playback became active; the first call also records startup (time-to-first-frame)
	playing() {
		if (this.startupMs === 0 && this.startedAt) this.startupMs = performance.now() - this.startedAt;
		if (this.playingSince === 0) this.playingSince = performance.now();
	}

	// paused or stalled — bank the playing time accrued so far
	private bankWatch() {
		if (this.playingSince) {
			this.watchMs += performance.now() - this.playingSince;
			this.playingSince = 0;
		}
	}
	paused() {
		this.bankWatch();
	}

	rebufferStarted() {
		this.bankWatch();
		this.rebuffers += 1;
		this.rebufferStart = performance.now();
	}
	rebufferEnded() {
		if (this.rebufferStart) {
			this.rebufferMs += performance.now() - this.rebufferStart;
			this.rebufferStart = 0;
		}
	}

	seeked() {
		this.seeks += 1;
	}

	quality(bitrateKbps: number, height: number) {
		this.bitrateKbps = bitrateKbps;
		if (bitrateKbps > this.maxBitrateKbps) this.maxBitrateKbps = bitrateKbps;
		if (height) this.videoHeight = height;
	}

	error(message: string) {
		this.errored = true;
		this.errorMessage = message.slice(0, 300);
		this.flush('heartbeat');
	}

	private endNow = () => this.end();

	end(completed = false) {
		if (this.done) return;
		this.done = true;
		this.completed = completed || this.completed;
		this.bankWatch();
		if (this.heartbeat) {
			clearInterval(this.heartbeat);
			this.heartbeat = null;
		}
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', this.onHide);
			window.removeEventListener('pagehide', this.endNow);
		}
		this.send('end', true);
	}

	// snapshot current accumulators without ending the view
	private flush(phase: 'heartbeat') {
		if (this.done) return;
		this.send(phase);
	}

	private payload(phase: 'start' | 'heartbeat' | 'end') {
		// include in-flight playing time so heartbeats reflect live watch time
		const liveWatch = this.watchMs + (this.playingSince ? performance.now() - this.playingSince : 0);
		return {
			view_id: this.viewId,
			stream_id: this.opts.streamId,
			viewer_id: this.viewer,
			phase,
			stream_type: this.opts.streamType,
			player: this.opts.player,
			player_version: this.opts.playerVersion ?? '',
			browser: this.env.browser,
			os: this.env.os,
			device: this.env.device,
			language: typeof navigator !== 'undefined' ? navigator.language : '',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
			startup_ms: Math.round(this.startupMs),
			watch_ms: Math.round(liveWatch),
			rebuffers: this.rebuffers,
			rebuffer_ms: Math.round(this.rebufferMs),
			bitrate_kbps: this.bitrateKbps,
			max_bitrate_kbps: this.maxBitrateKbps,
			video_height: this.videoHeight,
			seeks: this.seeks,
			errored: this.errored,
			error_message: this.errorMessage,
			completed: this.completed
		};
	}

	private send(phase: 'start' | 'heartbeat' | 'end', beacon = false) {
		api.track(this.payload(phase), beacon);
	}
}
