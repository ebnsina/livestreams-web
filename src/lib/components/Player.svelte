<script lang="ts">
	import Hls from 'hls.js';
	import { onDestroy } from 'svelte';
	import { PlaybackTracker } from '$lib/tracker';
	import {
		Play,
		Pause,
		Volume2,
		Volume1,
		VolumeX,
		Maximize,
		Minimize,
		PictureInPicture2,
		Settings2,
		RotateCcw,
		Lock,
		Loader2,
		Radio
	} from '@lucide/svelte';

	let {
		src,
		live = false,
		reload = 0,
		streamId = '',
		poster = '',
		storyboard = '',
		captions = ''
	}: {
		src: string;
		live?: boolean;
		reload?: number;
		streamId?: string;
		poster?: string;
		storyboard?: string;
		captions?: string;
	} = $props();

	// seek-preview storyboard (WebVTT sprite tiles)
	type SBCue = { start: number; end: number; img: string; x: number; y: number; w: number; h: number };
	let cues = $state<SBCue[]>([]);
	let seekWrap = $state<HTMLDivElement>();
	let hoverPct = $state(-1);

	function tsec(s: string) {
		const [h, m, rest] = s.trim().split(':');
		return +h * 3600 + +m * 60 + parseFloat(rest);
	}
	function parseVtt(text: string): SBCue[] {
		const out: SBCue[] = [];
		for (const block of text.split(/\r?\n\r?\n/)) {
			const lines = block.trim().split(/\r?\n/);
			const tl = lines.find((l) => l.includes('-->'));
			const ul = lines.find((l) => l.includes('#xywh='));
			if (!tl || !ul) continue;
			const [a, b] = tl.split('-->');
			const [base, frag] = ul.trim().split('#xywh=');
			const [x, y, w, h] = frag.split(',').map(Number);
			out.push({ start: tsec(a), end: tsec(b), img: base, x, y, w, h });
		}
		return out;
	}
	$effect(() => {
		cues = [];
		if (storyboard) {
			fetch(storyboard)
				.then((r) => r.text())
				.then((t) => (cues = parseVtt(t)))
				.catch(() => (cues = []));
		}
	});

	const isHls = $derived(/\.m3u8(\?|$)/i.test(src));

	// --- playback tracking (per-view QoS + engagement) ---
	let tracker: PlaybackTracker | null = null;

	let wrap = $state<HTMLDivElement>();
	let video = $state<HTMLVideoElement>();
	let hls: Hls | null = null;
	let error = $state(false);
	let errorKind = $state<'generic' | 'protected' | 'notready'>('generic');
	let ended = $state(false); // live stream has stopped publishing
	let retries = $state(0);
	let retry: ReturnType<typeof setTimeout> | null = null;
	let endWatchdog: ReturnType<typeof setTimeout> | null = null;

	// quality / rendition state
	type Level = { name: string; index: number; bitrate: number };
	let levels = $state<Level[]>([]);
	let selected = $state(-1); // -1 = auto
	let playingLevel = $state(-1);
	let menuOpen = $state(false);

	// playback / chrome state
	let paused = $state(true);
	let muted = $state(true);
	let volume = $state(1);
	let current = $state(0);
	let duration = $state(0);
	let bufferedEnd = $state(0);
	let isFs = $state(false);
	let buffering = $state(false);
	let controlsShown = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	const hasDuration = $derived(duration > 0 && isFinite(duration));
	const playedPct = $derived(hasDuration ? Math.min(100, (current / duration) * 100) : live ? 100 : 0);
	const bufferedPct = $derived(hasDuration ? Math.min(100, (bufferedEnd / duration) * 100) : 0);

	// seek-preview hover (depends on duration, declared above)
	const hoverTime = $derived(hasDuration && hoverPct >= 0 ? (hoverPct / 100) * duration : -1);
	const hoverCue = $derived.by(() => {
		if (hoverTime < 0 || cues.length === 0) return null;
		return cues.find((c) => hoverTime >= c.start && hoverTime < c.end) ?? cues[cues.length - 1];
	});
	function onSeekHover(e: PointerEvent) {
		if (!seekWrap || !hasDuration) return;
		const r = seekWrap.getBoundingClientRect();
		hoverPct = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
	}
	const controlsVisible = $derived(controlsShown || paused);

	$effect(() => {
		void reload;
		void src;
		restart();
		return teardown;
	});

	// Detect a live stream ending: when the parent flips `live` true→false
	// (owner stopped / status went offline), stop the spinner and show the
	// ended overlay instead of buffering forever.
	let prevLive = false;
	$effect(() => {
		const now = live;
		if (prevLive && !now && !error) markEnded();
		prevLive = now;
	});

	function clearWatchdog() {
		if (endWatchdog) {
			clearTimeout(endWatchdog);
			endWatchdog = null;
		}
	}

	// The stream stopped publishing: freeze on the last frame, surface a clean
	// "ended" state, and stop the QoS beacon. A manual reload can recover if it
	// was a false positive (e.g. a long network stall the watchdog tripped on).
	function markEnded() {
		if (ended) return;
		ended = true;
		buffering = false;
		clearWatchdog();
		tracker?.end();
		hls?.stopLoad();
	}

	// restart resets retry/error state then (re)initializes — used on src change
	// and the manual Retry button. Auto-retries call init() directly.
	function restart() {
		retries = 0;
		errorKind = 'generic';
		init();
	}

	function init() {
		error = false;
		ended = false;
		buffering = false;
		clearWatchdog();
		levels = [];
		selected = -1;
		teardown();
		if (!video || !src) return;
		if (streamId) {
			tracker = new PlaybackTracker({
				streamId,
				streamType: live ? 'live' : 'vod',
				player: isHls && Hls.isSupported() ? 'hls.js' : 'native',
				playerVersion: isHls ? Hls.version : ''
			});
			tracker.start();
		}

		if (isHls && Hls.isSupported()) {
			// Standard HLS (4s segments) — not LL-HLS — so lowLatencyMode would stall.
			hls = new Hls(live ? { liveSyncDurationCount: 3 } : {});
			hls.loadSource(src);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				levels =
					hls?.levels.map((l, i) => ({
						name: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`,
						index: i,
						bitrate: l.bitrate
					})) ?? [];
			});
			hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
				playingLevel = data.level;
				const l = hls?.levels[data.level];
				if (l) tracker?.quality(Math.round(l.bitrate / 1000), l.height ?? 0);
			});
			// The publisher appended #EXT-X-ENDLIST — a live playlist became final,
			// i.e. the stream stopped. Wait for playout to reach the end, then end.
			hls.on(Hls.Events.LEVEL_UPDATED, (_e, data) => {
				if (live && data.details && data.details.live === false) {
					const remaining = data.details.totalduration - (video?.currentTime ?? 0);
					clearWatchdog();
					endWatchdog = setTimeout(markEnded, Math.max(0, remaining * 1000));
				}
			});
			hls.on(Hls.Events.BUFFER_EOS, () => {
				if (live) markEnded();
			});
			hls.on(Hls.Events.ERROR, (_e, data) => {
				if (!data.fatal) return;
				const code = data.response?.code;
				if (code === 403) {
					errorKind = 'protected';
					error = true;
				} else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
					// 404/not-ready: live streams and freshly-transcoded VODs appear
					// after a few seconds — keep retrying instead of dead-ending.
					errorKind = 'notready';
					scheduleRetry();
				} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
					hls?.recoverMediaError();
				} else {
					errorKind = 'generic';
					error = true;
					tracker?.error(data.details || 'fatal playback error');
				}
			});
		} else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = src; // Safari native HLS
		} else if (!isHls) {
			video.src = src; // progressive mp4 (recordings/clips)
		} else {
			error = true;
		}
	}

	function pick(index: number) {
		selected = index;
		menuOpen = false;
		if (hls) hls.currentLevel = index;
	}

	function scheduleRetry() {
		error = true;
		if (retries >= 30) return; // give up after ~90s of polling
		retries++;
		if (retry) clearTimeout(retry);
		retry = setTimeout(() => init(), 3000);
	}

	// --- video events ---
	function onWaiting() {
		if (ended) return;
		buffering = true;
		tracker?.rebufferStarted();
		// On a live stream, an indefinite stall almost always means the publisher
		// went away. If we're still buffering after a grace period, call it ended.
		if (live) {
			clearWatchdog();
			endWatchdog = setTimeout(() => buffering && markEnded(), 20000);
		}
	}
	function onResume() {
		clearWatchdog();
		tracker?.rebufferEnded();
		tracker?.playing();
		buffering = false;
	}
	function onTime() {
		if (!video) return;
		current = video.currentTime;
		try {
			const b = video.buffered;
			if (b.length) bufferedEnd = b.end(b.length - 1);
		} catch {
			/* buffered not ready */
		}
	}

	// --- controls ---
	function togglePlay() {
		if (!video) return;
		if (video.paused) video.play().catch(() => {});
		else video.pause();
	}
	function toggleMute() {
		if (!video) return;
		video.muted = !video.muted;
	}
	function changeVolume(v: number) {
		if (!video) return;
		video.volume = v;
		video.muted = v === 0;
	}
	function seekTo(sec: number) {
		if (video && hasDuration) video.currentTime = sec;
	}
	function goLive() {
		if (video && hasDuration) video.currentTime = duration;
	}
	async function toggleFs() {
		if (!wrap) return;
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await wrap.requestFullscreen();
		} catch {
			/* denied */
		}
	}
	async function togglePip() {
		if (!video) return;
		try {
			if (document.pictureInPictureElement) await document.exitPictureInPicture();
			else await video.requestPictureInPicture();
		} catch {
			/* unsupported */
		}
	}
	function nudge(sec: number) {
		if (video && hasDuration) video.currentTime = Math.min(duration, Math.max(0, current + sec));
	}

	function poke() {
		controlsShown = true;
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (!paused && !menuOpen) controlsShown = false;
		}, 2600);
	}

	function onKey(e: KeyboardEvent) {
		switch (e.key) {
			case ' ':
			case 'k':
				e.preventDefault();
				togglePlay();
				break;
			case 'f':
				toggleFs();
				break;
			case 'm':
				toggleMute();
				break;
			case 'ArrowLeft':
				nudge(-5);
				break;
			case 'ArrowRight':
				nudge(5);
				break;
			case 'ArrowUp':
				changeVolume(Math.min(1, volume + 0.1));
				break;
			case 'ArrowDown':
				changeVolume(Math.max(0, volume - 0.1));
				break;
		}
		poke();
	}

	function teardown() {
		clearWatchdog();
		if (retry) {
			clearTimeout(retry);
			retry = null;
		}
		if (tracker) {
			tracker.end();
			tracker = null;
		}
		if (hls) {
			hls.destroy();
			hls = null;
		}
	}
	onDestroy(teardown);

	function onFsChange() {
		isFs = document.fullscreenElement === wrap;
	}

	function fmt(s: number) {
		if (!isFinite(s) || s < 0) return '0:00';
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = Math.floor(s % 60);
		return h
			? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
			: `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const currentLabel = $derived(
		selected === -1
			? `Auto${playingLevel >= 0 && levels[playingLevel] ? ` · ${levels[playingLevel].name}` : ''}`
			: (levels.find((l) => l.index === selected)?.name ?? 'Auto')
	);
</script>

<svelte:document onfullscreenchange={onFsChange} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={wrap}
	class="player group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-black select-none {controlsVisible
		? ''
		: 'cursor-none'}"
	tabindex="0"
	role="region"
	aria-label="Video player"
	onpointermove={poke}
	onmouseleave={() => !paused && (controlsShown = false)}
	onkeydown={onKey}
>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		autoplay
		playsinline
		poster={poster || undefined}
		bind:muted
		bind:volume
		onplay={() => {
			paused = false;
			tracker?.playing();
		}}
		onpause={() => {
			paused = true;
			tracker?.paused();
		}}
		onseeked={() => tracker?.seeked()}
		onwaiting={onWaiting}
		onplaying={onResume}
		oncanplay={onResume}
		onended={() => (live ? markEnded() : tracker?.end(true))}
		ontimeupdate={onTime}
		onprogress={onTime}
		onloadedmetadata={onTime}
		ondurationchange={() => video && (duration = video.duration)}
		onclick={togglePlay}
		ondblclick={toggleFs}
		class="aspect-video w-full bg-black"
	>
		{#if captions}
			<track kind="subtitles" label="Captions" srclang="en" src={captions} default />
		{/if}
	</video>

	<!-- LIVE badge -->
	{#if live && !ended}
		<div class="pointer-events-none absolute left-3 top-3 z-10">
			<span
				class="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-live)]"></span> LIVE
			</span>
		</div>
	{/if}

	<!-- center play / buffering -->
	{#if buffering && !error && !ended}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
		</div>
	{:else if paused && !error && !ended}
		<button
			class="absolute inset-0 z-10 flex items-center justify-center"
			onclick={togglePlay}
			aria-label="Play"
		>
			<span
				class="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-transform hover:scale-105"
			>
				<Play size={28} class="ml-1 fill-current" />
			</span>
		</button>
	{/if}

	<!-- ended overlay -->
	{#if ended}
		<div
			class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center text-sm text-white/70"
		>
			<span class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
				<Radio size={24} class="text-white/80" />
			</span>
			<p class="text-base font-medium text-white/90">This live stream has ended</p>
			<p class="max-w-xs text-xs">Thanks for watching. A recording may appear here shortly.</p>
			<button class="btn bg-white/15 text-white hover:bg-white/25" style="box-shadow:none" onclick={restart}>
				<RotateCcw size={14} /> Reload
			</button>
		</div>
	{/if}

	<!-- error / waiting overlay -->
	{#if error && !ended}
		<div
			class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center text-sm text-white/70"
		>
			{#if errorKind === 'protected'}
				<Lock size={26} class="text-white/80" />
				<p class="text-white/90">This content is protected.</p>
				<p class="max-w-xs text-xs">
					Open it with a signed link from the owner — a plain link won't play.
				</p>
				<button class="btn bg-white/15 text-white hover:bg-white/25" style="box-shadow:none" onclick={restart}>
					<RotateCcw size={14} /> Retry
				</button>
			{:else if errorKind === 'notready'}
				<Loader2 size={22} class="animate-spin text-white/80" />
				<p class="text-white/90">{live ? 'Waiting for the stream…' : 'Getting this ready…'}</p>
				<p class="max-w-xs text-xs">
					{live
						? "Start publishing to this stream's ingest URL."
						: 'It was just published — this can take a few seconds.'}
				</p>
			{:else}
				<p class="text-white/90">Couldn't play this.</p>
				<button class="btn bg-white/15 text-white hover:bg-white/25" style="box-shadow:none" onclick={restart}>
					<RotateCcw size={14} /> Retry
				</button>
			{/if}
		</div>
	{/if}

	<!-- control bar -->
	<div
		class="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200 {controlsVisible
			? 'opacity-100'
			: 'pointer-events-none opacity-0'}"
	>
		<!-- seek bar -->
		<div
			bind:this={seekWrap}
			class="relative mb-2 flex h-3.5 items-center"
			onpointermove={onSeekHover}
			onpointerleave={() => (hoverPct = -1)}
			role="presentation"
		>
			<!-- seek-preview thumbnail -->
			{#if hoverCue && hoverPct >= 0}
				<div
					class="pointer-events-none absolute bottom-6 z-10 -translate-x-1/2"
					style="left: {hoverPct}%"
				>
					<div
						class="overflow-hidden rounded-md border border-white/25 shadow-lg"
						style="width:{hoverCue.w}px;height:{hoverCue.h}px;background-image:url('{hoverCue.img}');background-position:-{hoverCue.x}px -{hoverCue.y}px;background-repeat:no-repeat"
					></div>
					<p class="mt-1 text-center font-mono text-[10px] text-white drop-shadow">{fmt(hoverTime)}</p>
				</div>
			{/if}
			<!-- base + buffered track (behind the range, which has a transparent unplayed track) -->
			<div class="pointer-events-none absolute h-1 w-full rounded-full bg-white/20"></div>
			<div
				class="pointer-events-none absolute h-1 rounded-full bg-white/30"
				style="width: {bufferedPct}%"
			></div>
			<input
				class="range seek absolute inset-x-0 w-full"
				type="range"
				min="0"
				max={hasDuration ? duration : 1}
				step="0.1"
				value={current}
				disabled={!hasDuration}
				style="--v: {playedPct}%"
				oninput={(e) => seekTo(+e.currentTarget.value)}
				aria-label="Seek"
			/>
		</div>

		<!-- buttons -->
		<div class="flex items-center gap-3 text-white">
			<button onclick={togglePlay} aria-label={paused ? 'Play' : 'Pause'} class="hover:text-white/80">
				{#if paused}<Play size={18} class="fill-current" />{:else}<Pause
						size={18}
						class="fill-current"
					/>{/if}
			</button>

			<!-- volume -->
			<div class="group/vol flex items-center gap-1.5">
				<button onclick={toggleMute} aria-label="Mute" class="hover:text-white/80">
					{#if muted || volume === 0}<VolumeX size={18} />{:else if volume < 0.5}<Volume1
							size={18}
						/>{:else}<Volume2 size={18} />{/if}
				</button>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={muted ? 0 : volume}
					style="--v: {(muted ? 0 : volume) * 100}%"
					oninput={(e) => changeVolume(+e.currentTarget.value)}
					class="range vol w-0 opacity-0 transition-[width,opacity] group-hover/vol:w-16 group-hover/vol:opacity-100"
					aria-label="Volume"
				/>
			</div>

			<!-- time / live -->
			{#if live}
				<button
					onclick={goLive}
					class="flex items-center gap-1.5 text-[12px] font-medium hover:text-white/80"
				>
					<span
						class="h-1.5 w-1.5 rounded-full {playedPct > 98
							? 'bg-[var(--color-live)]'
							: 'bg-white/40'}"
					></span>
					{playedPct > 98 ? 'Live' : 'Go live'}
				</button>
			{:else}
				<span class="font-mono text-[12px] tabular-nums text-white/85">
					{fmt(current)} / {fmt(duration)}
				</span>
			{/if}

			<div class="ml-auto flex items-center gap-3">
				<!-- quality -->
				{#if levels.length > 0}
					<div class="relative">
						<button
							onclick={() => (menuOpen = !menuOpen)}
							class="flex items-center gap-1 text-[12px] font-medium hover:text-white/80"
							aria-label="Quality"
						>
							<Settings2 size={17} />
							<span class="hidden font-mono sm:inline">{currentLabel}</span>
						</button>
						{#if menuOpen}
							<div
								class="absolute bottom-8 right-0 min-w-[130px] overflow-hidden rounded-lg border border-white/10 bg-black/90 py-1 backdrop-blur"
							>
								<button
									class="block w-full px-3 py-1.5 text-left font-mono text-[11px] hover:bg-white/10 {selected ===
									-1
										? 'text-[var(--color-accent)]'
										: 'text-white'}"
									onclick={() => pick(-1)}>Auto</button
								>
								{#each [...levels].reverse() as l (l.index)}
									<button
										class="flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-[11px] hover:bg-white/10 {selected ===
										l.index
											? 'text-[var(--color-accent)]'
											: 'text-white'}"
										onclick={() => pick(l.index)}
									>
										{l.name}<span class="text-white/40">{Math.round(l.bitrate / 1000)}k</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<button onclick={togglePip} aria-label="Picture in picture" class="hover:text-white/80">
					<PictureInPicture2 size={17} />
				</button>
				<button onclick={toggleFs} aria-label="Fullscreen" class="hover:text-white/80">
					{#if isFs}<Minimize size={18} />{:else}<Maximize size={18} />{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Unified coral range styling for both the seek bar and the volume slider.
	   --v (0–100%) drives the filled portion. */
	.range {
		-webkit-appearance: none;
		appearance: none;
		height: 14px; /* hit area */
		background: transparent;
		cursor: pointer;
	}
	.range:disabled {
		cursor: default;
		opacity: 0.5;
	}

	/* WebKit track: coral fill up to --v, light track after. */
	.range::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			var(--color-accent) var(--v, 0%),
			rgba(255, 255, 255, 0.28) var(--v, 0%)
		);
	}
	/* Seek leaves the unplayed part transparent so the buffered bar shows through. */
	.range.seek::-webkit-slider-runnable-track {
		background: linear-gradient(to right, var(--color-accent) var(--v, 0%), transparent var(--v, 0%));
	}
	.range::-webkit-slider-thumb {
		-webkit-appearance: none;
		margin-top: -4px; /* center 12px thumb on 4px track */
		height: 12px;
		width: 12px;
		border-radius: 9999px;
		background: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25);
		transition: transform 0.1s;
	}
	.range:hover::-webkit-slider-thumb {
		transform: scale(1.15);
	}

	/* Firefox */
	.range::-moz-range-track {
		height: 4px;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.28);
	}
	.range.seek::-moz-range-track {
		background: transparent;
	}
	.range::-moz-range-progress {
		height: 4px;
		border-radius: 9999px;
		background: var(--color-accent);
	}
	.range::-moz-range-thumb {
		height: 12px;
		width: 12px;
		border: none;
		border-radius: 9999px;
		background: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25);
	}

	.player:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
