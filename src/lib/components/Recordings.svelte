<script lang="ts">
	import { api } from '$lib/api';
	import type { Asset } from '$lib/types';
	import Player from './Player.svelte';
	import TranscodeProgress from './TranscodeProgress.svelte';

	let {
		assets,
		compact = false,
		onDelete,
		onClip,
		onEmbed,
		onRetry,
		onProgressDone
	}: {
		assets: Asset[];
		compact?: boolean;
		onDelete?: (id: string) => void;
		onClip?: (a: Asset) => void;
		onEmbed?: (a: Asset) => void;
		onRetry?: (id: string) => void;
		onProgressDone?: () => void;
	} = $props();

	const inProgress = (s: string) => s === 'pending' || s === 'uploading' || s === 'processing';

	let playingId = $state<string | null>(null);
	let playingUrl = $state<string | null>(null);
	let loadingId = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function play(a: Asset) {
		error = null;
		loadingId = a.id;
		try {
			const res = await api.assetPlayback(a.id);
			playingId = a.id;
			playingUrl = res.url;
		} catch {
			error = 'Could not load recording';
		} finally {
			loadingId = null;
		}
	}

	const typeLabel: Record<string, string> = {
		live_recording: 'Recording',
		vod: 'VOD',
		clip: 'Clip',
		upload: 'Upload'
	};

	function size(bytes: number) {
		if (bytes <= 0) return '—';
		const mb = bytes / 1024 / 1024;
		return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
	}
	function dur(sec: number) {
		if (!sec) return '';
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
	function when(s: string) {
		return new Date(s).toLocaleString();
	}
</script>

<section class="card overflow-hidden">
	<div class="border-b border-[var(--color-border)] px-5 py-3.5">
		<span class="text-[13px] font-semibold tracking-[-0.01em]">Recordings &amp; VOD</span>
	</div>

	{#if playingUrl}
		<div class="border-b border-[var(--color-border)] bg-black p-3">
			{#key playingUrl}
				<Player src={playingUrl} />
			{/key}
		</div>
	{/if}

	{#if error}
		<p class="px-5 py-2 text-sm text-red-500">{error}</p>
	{/if}

	{#if assets.length === 0}
		<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
			Nothing here yet. Recordings appear after a stream ends; upload a video to create VOD.
		</div>
	{:else}
		<ul class="divide-y divide-[var(--color-border)]">
			{#each assets as a (a.id)}
				<li class="flex items-center justify-between gap-3 px-5 py-3">
					<div class="flex min-w-0 items-center gap-3">
						{#if a.thumbnail}
							<img
								src={api.thumbnailUrl(a.id)}
								alt=""
								loading="lazy"
								class="h-10 w-16 shrink-0 rounded bg-[var(--color-surface-2)] object-cover"
							/>
						{:else}
							<div class="h-10 w-16 shrink-0 rounded bg-[var(--color-surface-2)]"></div>
						{/if}
						<div class="min-w-0">
						<p class="flex items-center gap-2 truncate text-sm font-medium">
							<span class="truncate">{a.title}</span>
							<span
								class="shrink-0 rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
								>{typeLabel[a.type] ?? a.type}</span
							>
						</p>
						<div class="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-[var(--color-muted)]">
							<span
								>{when(a.created_at)} · {size(a.size_bytes)}{a.duration_sec
									? ` · ${dur(a.duration_sec)}`
									: ''}</span
							>
							{#if inProgress(a.status)}
								<span>·</span>
								<TranscodeProgress assetId={a.id} onDone={onProgressDone} />
							{:else if a.status === 'errored'}
								· <span class="text-red-500" title={a.error}>failed</span>
							{/if}
						</div>
						</div>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<button
							class="btn-ghost text-sm {playingId === a.id ? 'text-[#ff5b3e]' : ''}"
							onclick={() => play(a)}
							disabled={loadingId === a.id || a.status !== 'ready'}
						>
							{loadingId === a.id ? 'Loading…' : playingId === a.id ? 'Playing' : 'Play'}
						</button>
						{#if inProgress(a.status) && !compact}
						<a class="btn-ghost text-sm" href="/transcode/{a.id}?title={encodeURIComponent(a.title)}"
							>Console</a
						>
					{/if}
					{#if onRetry && a.status === 'errored' && a.type !== 'clip'}
						<button class="btn-ghost text-sm" onclick={() => onRetry?.(a.id)}>Retry</button>
					{/if}
					{#if onEmbed && !compact && a.type === 'vod' && a.status === 'ready'}
							<button class="btn-ghost text-sm" onclick={() => onEmbed?.(a)}>Embed</button>
						{/if}
						{#if onClip && !compact && a.status === 'ready'}
							<button class="btn-ghost text-sm" onclick={() => onClip?.(a)}>Clip</button>
						{/if}
						{#if onDelete}
							<button class="btn-danger text-sm" onclick={() => onDelete?.(a.id)}>Delete</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
