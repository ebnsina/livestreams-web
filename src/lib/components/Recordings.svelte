<script lang="ts">
	import { api } from '$lib/api';
	import type { Asset } from '$lib/types';

	let {
		assets,
		compact = false,
		onDelete
	}: { assets: Asset[]; compact?: boolean; onDelete?: (id: string) => void } = $props();

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

	function size(bytes: number) {
		if (bytes <= 0) return '—';
		const mb = bytes / 1024 / 1024;
		return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
	}
	function when(s: string) {
		return new Date(s).toLocaleString();
	}
</script>

<section class="card overflow-hidden">
	<div class="border-b border-[var(--color-border)] px-5 py-3.5">
		<span class="text-[13px] font-semibold tracking-[-0.01em]">Recordings</span>
	</div>

	{#if playingUrl}
		<div class="border-b border-[var(--color-border)] bg-black p-3">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={playingUrl} controls autoplay class="aspect-video w-full rounded-lg bg-black"
			></video>
		</div>
	{/if}

	{#if error}
		<p class="px-5 py-2 text-sm text-red-500">{error}</p>
	{/if}

	{#if assets.length === 0}
		<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
			No recordings yet. They appear after a stream ends.
		</div>
	{:else}
		<ul class="divide-y divide-[var(--color-border)]">
			{#each assets as a (a.id)}
				<li class="flex items-center justify-between gap-3 px-5 py-3">
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{a.title}</p>
						<p class="font-mono text-[11px] text-[var(--color-muted)]">
							{when(a.created_at)} · {size(a.size_bytes)}
							{#if a.status !== 'ready'}· {a.status}{/if}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<button
							class="btn-ghost text-sm {playingId === a.id ? 'text-[#ff5b3e]' : ''}"
							onclick={() => play(a)}
							disabled={loadingId === a.id || a.status !== 'ready'}
						>
							{loadingId === a.id ? 'Loading…' : playingId === a.id ? 'Playing' : 'Play'}
						</button>
						{#if onDelete}
							<button class="btn-danger text-sm" onclick={() => onDelete?.(a.id)}>Delete</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
