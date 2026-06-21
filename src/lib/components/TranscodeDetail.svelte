<script lang="ts">
	import type { Asset } from '$lib/types';
	import Modal from './Modal.svelte';
	import TranscodeTimeline from './TranscodeTimeline.svelte';

	let {
		asset,
		onClose,
		onRetry,
		onEmbed,
		onClip
	}: {
		asset: Asset | null;
		onClose: () => void;
		onRetry?: (id: string) => void;
		onEmbed?: (a: Asset) => void;
		onClip?: (a: Asset) => void;
	} = $props();

	const typeLabel: Record<string, string> = {
		live_recording: 'Recording',
		vod: 'VOD',
		clip: 'Clip',
		upload: 'Upload'
	};

	function mb(b: number) {
		if (!b) return '—';
		const m = b / 1024 / 1024;
		return m >= 1 ? `${m.toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
	}
	function dur(s: number) {
		if (!s) return '—';
		const m = Math.floor(s / 60);
		return `${m}:${(s % 60).toString().padStart(2, '0')}`;
	}
</script>

<Modal open={!!asset} title={asset ? asset.title : ''} onClose={onClose}>
	{#if asset}
		{@const a = asset}
		<div class="space-y-4">
			<div class="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
				<span class="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-medium"
					>{typeLabel[a.type] ?? a.type}</span
				>
				<span>{mb(a.size_bytes)}</span>
				{#if a.duration_sec}<span>· {dur(a.duration_sec)}</span>{/if}
				<span>· {new Date(a.created_at).toLocaleString()}</span>
			</div>

			<!-- transcode timeline — always visible -->
			<div>
				<h3 class="mb-2 text-sm font-semibold">Transcode timeline</h3>
				<TranscodeTimeline assetId={a.id} height="52vh" />
			</div>

			<!-- actions -->
			<div class="flex flex-wrap justify-end gap-2">
				{#if onClip && a.status === 'ready'}
					<button class="btn-ghost text-sm" onclick={() => onClip?.(a)}>Clip</button>
				{/if}
				{#if onEmbed && a.type === 'vod' && a.status === 'ready'}
					<button class="btn-ghost text-sm" onclick={() => onEmbed?.(a)}>Embed</button>
				{/if}
				{#if onRetry && a.type !== 'clip' && a.status !== 'processing' && a.status !== 'uploading'}
					<button class="btn-ghost text-sm" onclick={() => onRetry?.(a.id)}>
						{a.status === 'errored' ? 'Retry' : 'Re-transcode'}
					</button>
				{/if}
				<a
					class="btn-ghost text-sm"
					href="/transcode/{a.id}?title={encodeURIComponent(a.title)}"
					target="_blank"
					rel="noopener">Full console ↗</a
				>
			</div>
		</div>
	{/if}
</Modal>
