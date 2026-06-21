<script lang="ts">
	import { onDestroy } from 'svelte';
	import { api } from '$lib/api';

	let { assetId, onDone }: { assetId: string; onDone?: () => void } = $props();

	type Stage = 'queued' | 'probing' | 'transcoding' | 'uploading' | 'ready' | 'failed';
	let stage = $state<Stage>('queued');
	let pct = $state(0);
	let message = $state('');
	let es: EventSource | null = null;

	const steps: { id: Stage; label: string }[] = [
		{ id: 'probing', label: 'Probe' },
		{ id: 'transcoding', label: 'Transcode' },
		{ id: 'uploading', label: 'Finalize' },
		{ id: 'ready', label: 'Ready' }
	];
	const order: Record<Stage, number> = {
		queued: 0,
		probing: 1,
		transcoding: 2,
		uploading: 3,
		ready: 4,
		failed: 4
	};
	const idx = $derived(order[stage]);

	$effect(() => {
		// (re)connect when the asset id changes
		es?.close();
		es = new EventSource(api.assetEventStreamUrl(assetId));
		es.onmessage = (e) => {
			try {
				const p = JSON.parse(e.data) as { stage: Stage; pct: number; message?: string };
				stage = p.stage;
				pct = p.pct ?? 0;
				message = p.message ?? '';
				if (p.stage === 'ready' || p.stage === 'failed') {
					es?.close();
					es = null;
					onDone?.();
				}
			} catch {
				/* ignore malformed frame */
			}
		};
		es.onerror = () => {
			// auto-reconnect is handled by EventSource; nothing to do
		};
		return () => {
			es?.close();
			es = null;
		};
	});

	onDestroy(() => es?.close());
</script>

{#if stage === 'failed'}
	<span class="text-[11px] text-red-500" title={message}>failed</span>
{:else if stage !== 'ready'}
	<div class="flex items-center gap-2">
		<!-- step pips -->
		<div class="flex items-center gap-1">
			{#each steps as s, i (s.id)}
				<span
					class="h-1.5 w-1.5 rounded-full transition-colors {i < idx
						? 'bg-[#ff5b3e]'
						: i === idx
							? 'animate-pulse bg-[#ff5b3e]'
							: 'bg-[var(--color-border)]'}"
					title={s.label}
				></span>
			{/each}
		</div>
		{#if stage === 'transcoding'}
			<div class="h-1 w-24 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
				<div class="h-full bg-[#ff5b3e] transition-all" style="width: {pct}%"></div>
			</div>
			<span class="font-mono text-[11px] tabular-nums text-[var(--color-muted)]">{pct}%</span>
		{:else}
			<span class="text-[11px] text-[var(--color-muted)]">{message || stage}…</span>
		{/if}
	</div>
{/if}
