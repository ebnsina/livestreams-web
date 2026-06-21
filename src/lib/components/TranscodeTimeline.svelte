<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { api } from '$lib/api';

	let { assetId, height = '46vh' }: { assetId: string; height?: string } = $props();

	type Metrics = {
		frame: number;
		fps: number;
		speed: string;
		bitrate: string;
		total_size: number;
		time_sec: number;
	};
	type Frame = {
		stage: string;
		pct: number;
		message?: string;
		status?: string;
		line?: string;
		metrics?: Metrics;
	};
	type Row = { t: string; kind: 'log' | 'metric'; text: string };

	let stage = $state('loading');
	let pct = $state(0);
	let metrics = $state<Metrics | null>(null);
	let rows = $state<Row[]>([]);
	let live = $state(false);
	let es: EventSource | null = null;
	let term = $state<HTMLDivElement>();

	const terminal = (s: string) => s === 'ready' || s === 'failed';

	function mb(b: number) {
		if (!b) return '0';
		const m = b / 1024 / 1024;
		return m >= 1 ? `${m.toFixed(1)}MB` : `${Math.round(b / 1024)}KB`;
	}
	function clock(s: number) {
		const m = Math.floor(s / 60);
		return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
	}
	function hhmm(iso: string) {
		const d = new Date(iso);
		return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	async function append(r: Row) {
		rows = [...rows, r];
		await tick();
		if (term) term.scrollTop = term.scrollHeight;
	}

	function connectLive() {
		live = true;
		es = new EventSource(api.assetEventStreamUrl(assetId));
		es.onmessage = (e) => {
			let f: Frame;
			try {
				f = JSON.parse(e.data);
			} catch {
				return;
			}
			stage = f.stage;
			if (f.pct != null && !f.line) pct = f.pct;
			if (f.line) {
				append({ t: now(), kind: 'log', text: f.line });
			} else if (f.metrics) {
				metrics = f.metrics;
				const m = f.metrics;
				append({
					t: now(),
					kind: 'metric',
					text:
						`frame=${m.frame}  fps=${m.fps.toFixed(1)}  time=${clock(m.time_sec)}  ` +
						`br=${m.bitrate || '—'}  size=${mb(m.total_size)}  speed=${m.speed || '—'}  [${f.pct}%]`
				});
			}
			if (terminal(f.stage)) {
				live = false;
				es?.close();
				es = null;
			}
		};
	}
	function now() {
		return new Date().toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	$effect(() => {
		es?.close();
		es = null;
		rows = [];
		metrics = null;
		pct = 0;
		stage = 'loading';
		const aid = assetId;
		(async () => {
			try {
				const res = await api.transcodeLogs(aid);
				if (aid !== assetId) return; // changed while loading
				stage = res.status;
				if (res.status === 'ready') pct = 100;
				for (const l of res.logs) {
					rows = [...rows, { t: hhmm(l.at), kind: 'log', text: l.line }];
				}
				await tick();
				if (term) term.scrollTop = term.scrollHeight;
				if (!terminal(res.status)) connectLive();
			} catch {
				stage = 'unavailable';
			}
		})();
		return () => {
			es?.close();
			es = null;
		};
	});

	onDestroy(() => es?.close());

	const stageColor: Record<string, string> = {
		probing: 'bg-sky-500/15 text-sky-400',
		transcoding: 'bg-[#ff5b3e]/15 text-[#ff5b3e]',
		uploading: 'bg-amber-500/15 text-amber-400',
		ready: 'bg-emerald-500/15 text-emerald-400',
		failed: 'bg-red-500/15 text-red-400',
		loading: 'bg-white/10 text-white/60',
		processing: 'bg-[#ff5b3e]/15 text-[#ff5b3e]'
	};
</script>

<div class="flex items-center justify-between gap-3 pb-2">
	<span class="rounded-md px-2 py-0.5 text-[11px] font-semibold {stageColor[stage] ?? stageColor.loading}">
		{stage}{live ? ' · live' : ''}
	</span>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--color-muted)]">
		<span>{pct}%</span>
		<span>fps {metrics ? metrics.fps.toFixed(0) : '—'}</span>
		<span>speed {metrics?.speed || '—'}</span>
		<span>frame {metrics?.frame ?? '—'}</span>
		<span>out {metrics ? clock(metrics.time_sec) : '—'}</span>
	</div>
</div>

<div class="mb-2 h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
	<div class="h-full rounded-full bg-[#ff5b3e] transition-all" style="width: {pct}%"></div>
</div>

<div
	bind:this={term}
	class="overflow-y-auto rounded-lg border border-[#1f1f23] bg-[#0b0b0c] p-3 font-mono text-[12px] leading-relaxed"
	style="height: {height}"
>
	{#if rows.length === 0}
		<p class="text-white/30">No transcode activity recorded.</p>
	{/if}
	{#each rows as r, i (i)}
		<div class="flex gap-3">
			<span class="shrink-0 text-white/30 tabular-nums">{r.t}</span>
			<span
				class={r.kind === 'metric'
					? 'text-white/65'
					: r.text.startsWith('✔')
						? 'text-emerald-400'
						: r.text.startsWith('✖')
							? 'text-red-400'
							: r.text.startsWith('▶')
								? 'text-[#ff7a63]'
								: 'text-white/55'}>{r.text}</span
			>
		</div>
	{/each}
	{#if live}
		<div class="mt-1 text-white/40">▍<span class="animate-pulse">working…</span></div>
	{/if}
</div>
