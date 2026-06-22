<script lang="ts">
	import Hls from 'hls.js';
	import { onDestroy } from 'svelte';
	import { api } from '$lib/api';
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
		RotateCcw
	} from '@lucide/svelte';

	let {
		src,
		live = false,
		reload = 0,
		streamId = ''
	}: { src: string; live?: boolean; reload?: number; streamId?: string } = $props();

	const isHls = $derived(/\.m3u8(\?|$)/i.test(src));

	// --- QoS tracking ---
	const viewerId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36);
	let startedAt = 0;
	let startupMs = 0;
	let rebufferStart = 0;
	let rebufferMs = 0;
	let beaconTimer: ReturnType<typeof setInterval> | null = null;

	function beacon() {
		if (!streamId) return;
		const br =
			playingLevel >= 0 && levels[playingLevel] ? Math.round(levels[playingLevel].bitrate / 1000) : 0;
		api.sendBeacon({
			stream_id: streamId,
			viewer_id: viewerId,
			startup_ms: Math.round(startupMs),
			rebuffers,
			rebuffer_ms: Math.round(rebufferMs),
			bitrate_kbps: br
		});
	}

	let wrap = $state<HTMLDivElement>();
	let video = $state<HTMLVideoElement>();
	let hls: Hls | null = null;
	let error = $state(false);
	let retry: ReturnType<typeof setTimeout> | null = null;

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
	let rebuffers = $state(0);
	let controlsShown = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	const hasDuration = $derived(duration > 0 && isFinite(duration));
	const playedPct = $derived(hasDuration ? Math.min(100, (current / duration) * 100) : live ? 100 : 0);
	const bufferedPct = $derived(hasDuration ? Math.min(100, (bufferedEnd / duration) * 100) : 0);
	const controlsVisible = $derived(controlsShown || paused);

	$effect(() => {
		void reload;
		void src;
		void live;
		init();
		return teardown;
	});

	function init() {
		error = false;
		buffering = false;
		levels = [];
		selected = -1;
		startedAt = performance.now();
		startupMs = 0;
		rebufferMs = 0;
		rebufferStart = 0;
		teardown();
		if (!video || !src) return;
		beaconTimer = setInterval(beacon, 10000);

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
			hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => (playingLevel = data.level));
			hls.on(Hls.Events.ERROR, (_e, data) => {
				if (!data.fatal) return;
				if (live && data.type === Hls.ErrorTypes.NETWORK_ERROR) scheduleRetry();
				else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
				else error = true;
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
		if (retry) clearTimeout(retry);
		retry = setTimeout(() => hls?.startLoad(), 2000);
	}

	// --- video events ---
	function onWaiting() {
		buffering = true;
		rebuffers += 1;
		rebufferStart = performance.now();
	}
	function onResume() {
		if (rebufferStart) {
			rebufferMs += performance.now() - rebufferStart;
			rebufferStart = 0;
		}
		if (startupMs === 0 && startedAt) {
			startupMs = performance.now() - startedAt;
			beacon();
		}
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
		if (beaconTimer) {
			clearInterval(beaconTimer);
			beaconTimer = null;
		}
		if (retry) {
			clearTimeout(retry);
			retry = null;
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
		bind:muted
		bind:volume
		onplay={() => (paused = false)}
		onpause={() => (paused = true)}
		onwaiting={onWaiting}
		onplaying={onResume}
		oncanplay={onResume}
		ontimeupdate={onTime}
		onprogress={onTime}
		onloadedmetadata={onTime}
		ondurationchange={() => video && (duration = video.duration)}
		onclick={togglePlay}
		ondblclick={toggleFs}
		class="aspect-video w-full bg-black"
	></video>

	<!-- LIVE badge -->
	{#if live}
		<div class="pointer-events-none absolute left-3 top-3 z-10">
			<span
				class="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-live)]"></span> LIVE
			</span>
		</div>
	{/if}

	<!-- center play / buffering -->
	{#if buffering && !error}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
		</div>
	{:else if paused && !error}
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

	<!-- error / waiting overlay -->
	{#if error}
		<div
			class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 text-center text-sm text-white/70"
		>
			<p class="text-white/90">{live ? 'Waiting for the stream…' : 'Nothing to play yet.'}</p>
			{#if live}
				<p class="text-xs">Start publishing from OBS to this stream's ingest URL.</p>
			{:else}
				<button class="btn-ghost border-white/20 text-white" onclick={init}>
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
		<div class="relative mb-2 flex h-3.5 items-center">
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
										? 'text-[#ff5b3e]'
										: 'text-white'}"
									onclick={() => pick(-1)}>Auto</button
								>
								{#each [...levels].reverse() as l (l.index)}
									<button
										class="flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-[11px] hover:bg-white/10 {selected ===
										l.index
											? 'text-[#ff5b3e]'
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
			#ff5b3e var(--v, 0%),
			rgba(255, 255, 255, 0.28) var(--v, 0%)
		);
	}
	/* Seek leaves the unplayed part transparent so the buffered bar shows through. */
	.range.seek::-webkit-slider-runnable-track {
		background: linear-gradient(to right, #ff5b3e var(--v, 0%), transparent var(--v, 0%));
	}
	.range::-webkit-slider-thumb {
		-webkit-appearance: none;
		margin-top: -4px; /* center 12px thumb on 4px track */
		height: 12px;
		width: 12px;
		border-radius: 9999px;
		background: #ff5b3e;
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
		background: #ff5b3e;
	}
	.range::-moz-range-thumb {
		height: 12px;
		width: 12px;
		border: none;
		border-radius: 9999px;
		background: #ff5b3e;
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25);
	}

	.player:focus-visible {
		outline: 2px solid #ff5b3e;
		outline-offset: 2px;
	}
</style>
