<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { ArrowLeft, Terminal } from '@lucide/svelte';

	const id = $derived(page.params.id as string);
	const title = $derived(page.url.searchParams.get('title') || '');

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
	type Row = { t: string; kind: 'log' | 'metric' | 'stage'; text: string };

	let stage = $state('connecting');
	let pct = $state(0);
	let metrics = $state<Metrics | null>(null);
	let rows = $state<Row[]>([]);
	let done = $state(false);
	let es: EventSource | null = null;
	let term = $state<HTMLDivElement>();
	let startMs = 0;

	function stamp() {
		if (!startMs) startMs = Date.now();
		const s = (Date.now() - startMs) / 1000;
		return `+${s.toFixed(2)}s`;
	}
	function mb(b: number) {
		if (!b) return '0';
		const m = b / 1024 / 1024;
		return m >= 1 ? `${m.toFixed(1)}MB` : `${Math.round(b / 1024)}KB`;
	}
	function clock(s: number) {
		const m = Math.floor(s / 60);
		return `${m}:${Math.floor(s % 60)
			.toString()
			.padStart(2, '0')}`;
	}

	async function push(r: Row) {
		rows = [...rows, r];
		await tick();
		if (term) term.scrollTop = term.scrollHeight;
	}

	$effect(() => {
		es?.close();
		rows = [];
		done = false;
		startMs = 0;
		es = new EventSource(api.assetEventStreamUrl(id));
		es.onopen = () => push({ t: stamp(), kind: 'log', text: `● connected to asset ${id}` });
		es.onmessage = (e) => {
			let f: Frame;
			try {
				f = JSON.parse(e.data);
			} catch {
				return;
			}
			stage = f.stage;
			// log-line frames carry pct:0 — don't let them reset the bar
			if (f.pct != null && !f.line) pct = f.pct;

			if (f.line) {
				push({ t: stamp(), kind: 'log', text: f.line });
			} else if (f.metrics) {
				metrics = f.metrics;
				const m = f.metrics;
				push({
					t: stamp(),
					kind: 'metric',
					text:
						`frame=${m.frame}  fps=${m.fps.toFixed(1)}  time=${clock(m.time_sec)}  ` +
						`br=${m.bitrate || '—'}  size=${mb(m.total_size)}  speed=${m.speed || '—'}  [${f.pct}%]`
				});
			} else if (f.message) {
				push({ t: stamp(), kind: 'stage', text: `» ${f.stage}: ${f.message}` });
			}

			if (f.stage === 'ready' || f.stage === 'failed') {
				done = true;
				es?.close();
				es = null;
			}
		};
		es.onerror = () => {
			if (!done) push({ t: stamp(), kind: 'log', text: '… connection lost, retrying' });
		};
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
		connecting: 'bg-white/10 text-white/60'
	};
</script>

<svelte:head><title>Transcode console · Livestreams</title></svelte:head>

<header class="mb-5 flex items-start justify-between gap-4">
	<div class="min-w-0">
		<a
			href="/recordings"
			class="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
		>
			<ArrowLeft size={14} /> Recordings
		</a>
		<h1 class="flex items-center gap-2 text-2xl font-semibold">
			<Terminal size={22} /> Transcode console
		</h1>
		<p class="mt-1 truncate font-mono text-xs text-[var(--color-muted)]">
			{title ? `${title} · ` : ''}{id}
		</p>
	</div>
	<span class="rounded-md px-2.5 py-1 text-xs font-semibold {stageColor[stage] ?? stageColor.connecting}">
		{stage}
	</span>
</header>

<!-- live metrics strip -->
<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Progress</p>
		<p class="mt-0.5 font-mono text-lg font-semibold tabular-nums">{pct}%</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">FPS</p>
		<p class="mt-0.5 font-mono text-lg tabular-nums">{metrics ? metrics.fps.toFixed(1) : '—'}</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Speed</p>
		<p class="mt-0.5 font-mono text-lg tabular-nums">{metrics?.speed || '—'}</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Bitrate</p>
		<p class="mt-0.5 font-mono text-sm tabular-nums">{metrics?.bitrate || '—'}</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Frame</p>
		<p class="mt-0.5 font-mono text-lg tabular-nums">{metrics?.frame ?? '—'}</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Output</p>
		<p class="mt-0.5 font-mono text-sm tabular-nums">{metrics ? mb(metrics.total_size) : '—'}</p>
	</div>
	<div class="card p-3">
		<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Out time</p>
		<p class="mt-0.5 font-mono text-sm tabular-nums">{metrics ? clock(metrics.time_sec) : '—'}</p>
	</div>
</div>

<!-- progress bar -->
<div class="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
	<div
		class="h-full rounded-full bg-[#ff5b3e] transition-all"
		style="width: {pct}%"
	></div>
</div>

<!-- terminal -->
<div
	bind:this={term}
	class="h-[55vh] overflow-y-auto rounded-xl border border-[#1f1f23] bg-[#0b0b0c] p-4 font-mono text-[12.5px] leading-relaxed"
>
	{#each rows as r, i (i)}
		<div class="flex gap-3">
			<span class="shrink-0 text-white/30 tabular-nums">{r.t}</span>
			<span
				class={r.kind === 'metric'
					? 'text-white/70'
					: r.text.startsWith('✔')
						? 'text-emerald-400'
						: r.text.startsWith('✖')
							? 'text-red-400'
							: r.text.startsWith('▶')
								? 'text-[#ff7a63]'
								: r.text.startsWith('»')
									? 'text-sky-400'
									: 'text-white/55'}
			>{r.text}</span>
		</div>
	{/each}
	{#if !done}
		<div class="mt-1 flex gap-3">
			<span class="shrink-0 text-white/30">{stamp()}</span>
			<span class="text-white/40">▍<span class="animate-pulse">working…</span></span>
		</div>
	{/if}
</div>
