<script lang="ts">
	import Hls from 'hls.js';
	import { onDestroy } from 'svelte';

	let {
		src,
		live = false,
		reload = 0
	}: { src: string; live?: boolean; reload?: number } = $props();

	let video: HTMLVideoElement;
	let hls: Hls | null = null;
	let error = $state(false);
	let retry: ReturnType<typeof setTimeout> | null = null;

	// quality / rendition state
	type Level = { name: string; index: number; bitrate: number };
	let levels = $state<Level[]>([]);
	let selected = $state(-1); // -1 = auto
	let playingLevel = $state(-1); // actual level when auto
	let menuOpen = $state(false);

	// QoS
	let buffering = $state(false);
	let rebuffers = $state(0);

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
		teardown();
		if (!video || !src) return;

		if (Hls.isSupported()) {
			hls = new Hls({ lowLatencyMode: true, liveSyncDurationCount: 3 });
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
			});
			hls.on(Hls.Events.ERROR, (_e, data) => {
				if (!data.fatal) return;
				if (live && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
					scheduleRetry();
				} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
					hls?.recoverMediaError();
				} else {
					error = true;
				}
			});
		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = src; // Safari native HLS (no manual level control)
		} else {
			error = true;
		}
	}

	function pick(index: number) {
		selected = index;
		menuOpen = false;
		if (hls) hls.currentLevel = index; // -1 = auto
	}

	function scheduleRetry() {
		error = true;
		if (retry) clearTimeout(retry);
		retry = setTimeout(() => hls?.startLoad(), 2000);
	}

	function onWaiting() {
		buffering = true;
		rebuffers += 1;
	}
	function onResume() {
		buffering = false;
	}

	function teardown() {
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

	const currentLabel = $derived(
		selected === -1
			? `Auto${playingLevel >= 0 && levels[playingLevel] ? ` · ${levels[playingLevel].name}` : ''}`
			: (levels.find((l) => l.index === selected)?.name ?? 'Auto')
	);
</script>

<div class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-black">
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		controls
		autoplay
		muted
		playsinline
		onwaiting={onWaiting}
		onplaying={onResume}
		oncanplay={onResume}
		class="aspect-video w-full bg-black"
	></video>

	<!-- quality selector (top-right) -->
	{#if levels.length > 0}
		<div class="absolute right-3 top-3 z-10">
			<button
				class="rounded-md bg-black/60 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{currentLabel}
			</button>
			{#if menuOpen}
				<div
					class="absolute right-0 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-white/10 bg-black/85 backdrop-blur"
				>
					<button
						class="block w-full px-3 py-1.5 text-left font-mono text-[11px] text-white hover:bg-white/10 {selected ===
						-1
							? 'text-violet-400'
							: ''}"
						onclick={() => pick(-1)}>Auto</button
					>
					{#each [...levels].reverse() as l (l.index)}
						<button
							class="block w-full px-3 py-1.5 text-left font-mono text-[11px] text-white hover:bg-white/10 {selected ===
							l.index
								? 'text-violet-400'
								: ''}"
							onclick={() => pick(l.index)}
						>
							{l.name}
							<span class="text-white/40">{Math.round(l.bitrate / 1000)}k</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- buffering spinner -->
	{#if buffering && !error}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"
			></div>
		</div>
	{/if}

	<!-- waiting overlay -->
	{#if error}
		<div
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center text-sm text-[var(--color-muted)]"
		>
			<p>{live ? 'Waiting for the stream…' : 'Nothing to play yet.'}</p>
			<p class="text-xs">Start publishing from OBS to this stream's ingest URL.</p>
		</div>
	{/if}
</div>

{#if levels.length > 0}
	<div class="mt-2 flex flex-wrap items-center gap-2">
		<span class="text-xs text-[var(--color-muted)]">Quality</span>
		<!-- clickable rendition switcher -->
		<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
			<button
				class="rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {selected ===
				-1
					? 'bg-[var(--color-surface)] text-violet-500 shadow-sm'
					: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
				onclick={() => pick(-1)}
			>
				Auto{selected === -1 && playingLevel >= 0 && levels[playingLevel]
					? ` · ${levels[playingLevel].name}`
					: ''}
			</button>
			{#each [...levels].reverse() as l (l.index)}
				<button
					class="rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {selected ===
					l.index
						? 'bg-[var(--color-surface)] text-violet-500 shadow-sm'
						: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
					onclick={() => pick(l.index)}
					title="{Math.round(l.bitrate / 1000)} kbps"
				>
					{l.name}
				</button>
			{/each}
		</div>
		<span class="ml-auto text-xs text-[var(--color-muted)]"
			>Rebuffers: <span class="font-mono tabular-nums">{rebuffers}</span></span
		>
	</div>
{/if}
