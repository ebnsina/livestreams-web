<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import type { StreamEvent } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ScheduleBadge from '$lib/components/ScheduleBadge.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import BrowserGoLive from '$lib/components/BrowserGoLive.svelte';
	import Player from '$lib/components/Player.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import Recordings from '$lib/components/Recordings.svelte';
	import Restream from '$lib/components/Restream.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import EmbedSnippet from '$lib/components/EmbedSnippet.svelte';
	import { toast } from '$lib/toast.svelte';

	const qc = useQueryClient();
	const id = $derived(page.params.id as string);

	let anRange = $state<'24h' | '7d' | '30d'>('24h');
	const analytics = createQuery(() => ({
		queryKey: ['streams', id, 'analytics', anRange],
		queryFn: () => api.streamAnalytics(id, anRange),
		refetchInterval: 15000
	}));
	const anSeries = $derived(analytics.data?.series ?? []);
	const anRanges: { id: '24h' | '7d' | '30d'; label: string }[] = [
		{ id: '24h', label: '24h' },
		{ id: '7d', label: '7d' },
		{ id: '30d', label: '30d' }
	];

	const stream = createQuery(() => ({
		queryKey: keys.stream(id),
		queryFn: () => api.getStream(id),
		refetchInterval: 8000 // status fallback; live events arrive via SSE
	}));
	const s = $derived(stream.data);
	const isLive = $derived(s?.status === 'live');

	const sessions = createQuery(() => ({
		queryKey: keys.sessions(id),
		queryFn: () => api.sessions(id)
	}));

	const recordings = createQuery(() => ({
		queryKey: keys.recordings(id),
		queryFn: () => api.streamRecordings(id),
		refetchInterval: 10000 // a recording appears shortly after a stream ends
	}));

	const qos = createQuery(() => ({
		queryKey: ['streams', id, 'qos'],
		queryFn: () => api.qos(id),
		refetchInterval: 5000
	}));

	// --- activity log: history (REST) + live (SSE) ---
	const history = createQuery(() => ({
		queryKey: keys.events(id),
		queryFn: () => api.events(id)
	}));

	let liveEvents = $state<StreamEvent[]>([]);
	let playerReload = $state(0);

	// Merge live + history, newest first, deduped by id.
	const timeline = $derived.by(() => {
		const seen = new Set<string>();
		const all: StreamEvent[] = [];
		for (const e of [...liveEvents, ...(history.data?.data ?? [])]) {
			if (seen.has(e.id)) continue;
			seen.add(e.id);
			all.push(e);
		}
		return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
	});

	// Active ingest-health issues: replay the timeline newest-first; the first
	// event seen per rule wins. A rule is "active" if its latest event is an
	// alert (not a recovery).
	const healthIssues = $derived.by(() => {
		const seen = new Set<string>();
		const active: string[] = [];
		for (const e of timeline) {
			const rule = (e.data as Record<string, unknown> | undefined)?.rule as string | undefined;
			if (!rule || seen.has(rule)) continue;
			seen.add(rule);
			if (e.type !== 'health.recovered') active.push(e.message);
		}
		return active;
	});

	// Open the SSE stream for this stream id; reconnects when id changes.
	$effect(() => {
		liveEvents = [];
		const es = new EventSource(api.eventStreamUrl(id));
		es.onmessage = (e) => {
			try {
				const ev = JSON.parse(e.data) as StreamEvent;
				liveEvents = [ev, ...liveEvents];
				if (ev.type.startsWith('session.')) {
					qc.invalidateQueries({ queryKey: keys.stream(id) });
					qc.invalidateQueries({ queryKey: keys.sessions(id) });
				}
				if (ev.type === 'recording.saved' || ev.type === 'session.ended') {
					qc.invalidateQueries({ queryKey: keys.recordings(id) });
				}
				if (ev.type === 'session.started' || ev.type === 'transcode.started') {
					playerReload++; // pick up the freshly-live stream
				}
			} catch {
				/* ignore malformed frame */
			}
		};
		return () => es.close();
	});

	const rotate = createMutation(() => ({
		mutationFn: () => api.rotateKey(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.stream(id) });
			toast.success('Stream key rotated');
		},
		onError: () => toast.error("Couldn't rotate stream key — try again")
	}));

	// schedule editor
	let editingSchedule = $state(false);
	let scheduleVal = $state('');
	const saveSchedule = createMutation(() => ({
		mutationFn: (iso: string | null) =>
			api.updateStream(id, { name: s?.name ?? '', description: s?.description ?? '', scheduled_at: iso }),
		onSuccess: () => {
			editingSchedule = false;
			qc.invalidateQueries({ queryKey: keys.stream(id) });
			toast.success('Saved');
		},
		onError: () => toast.error("Couldn't save schedule — try again")
	}));

	const stop = createMutation(() => ({
		mutationFn: () => api.stopStream(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.stream(id) });
			toast.success('Stream stopped');
		},
		onError: () => toast.error("Couldn't stop stream — try again")
	}));

	const remove = createMutation(() => ({
		mutationFn: () => api.deleteStream(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.streams });
			goto('/streams');
			toast.success('Deleted');
		},
		onError: () => toast.error("Couldn't delete stream — try again")
	}));

	function fmtDate(d: string | null) {
		return d ? new Date(d).toLocaleString() : '—';
	}
</script>

{#snippet qosStat(label: string, value: string)}
	<div class="bg-[var(--color-surface)] p-3">
		<p class="text-[11px] text-[var(--color-muted)]">{label}</p>
		<p class="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</p>
	</div>
{/snippet}

<a
	href="/streams"
	class="mb-4 inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
	>← Back to streams</a
>

{#if stream.isPending}
	<p class="text-sm text-[var(--color-muted)]">Loading…</p>
{:else if stream.isError || !s}
	<p class="text-sm text-red-400">Could not load this stream.</p>
{:else}
	<header class="mb-6 flex items-start justify-between gap-4">
		<div>
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="text-2xl font-semibold">{s.name}</h1>
				<StatusBadge status={s.status} />
				{#if !isLive}<ScheduleBadge at={s.scheduled_at} />{/if}
				{#if isLive}
					{#if healthIssues.length > 0}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500"
							title={healthIssues.join('\n')}
						>
							⚠ {healthIssues.length} issue{healthIssues.length === 1 ? '' : 's'}
						</span>
					{:else}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-500"
						>
							Healthy
						</span>
					{/if}
				{/if}
			</div>
			{#if s.description}<p class="mt-1 text-sm text-[var(--color-muted)]">{s.description}</p>{/if}
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if auth.canWrite}
				{#if isLive}
					<button class="btn-ghost" onclick={() => stop.mutate()} disabled={stop.isPending}>
						{stop.isPending ? 'Stopping…' : 'Stop stream'}
					</button>
				{/if}
				<button class="btn-danger" onclick={() => remove.mutate()} disabled={remove.isPending}>
					Delete
				</button>
			{/if}
		</div>
	</header>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
		<!-- Player -->
		<div class="min-w-0 space-y-4">
			<Player src={s.playback_url} live={isLive} reload={playerReload} streamId={id} />

			{#if auth.canWrite && s.ingest?.whip_url && !isLive}
				<BrowserGoLive whipUrl={s.ingest.whip_url} />
			{/if}

			<!-- Playback QoS (from viewer beacons) -->
			<div class="card grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
				{@render qosStat('Viewers', qos.data ? String(qos.data.viewers) : '—')}
				{@render qosStat(
					'Avg startup',
					qos.data?.avg_startup_ms ? `${qos.data.avg_startup_ms} ms` : '—'
				)}
				{@render qosStat('Rebuffers', qos.data ? String(qos.data.total_rebuffers) : '—')}
				{@render qosStat(
					'Avg bitrate',
					qos.data?.avg_bitrate_kbps ? `${qos.data.avg_bitrate_kbps}k` : '—'
				)}
			</div>

			<div class="card space-y-3 p-4">
				<h2 class="text-sm font-semibold text-[var(--color-muted)]">Share &amp; embed</h2>
				<EmbedSnippet {id} kind="live" hlsUrl={s.playback_url} />
			</div>
			<Timeline events={timeline} live={isLive} />
		</div>

		<!-- Ingest + meta -->
		<div class="min-w-0 space-y-4">
			<div class="card space-y-4 p-5">
				<h2 class="text-sm font-semibold text-[var(--color-muted)]">Ingest</h2>
				{#if s.ingest?.rtmp_url}
					<CopyField label="RTMP Server" value={s.ingest.rtmp_url} />
				{/if}
				{#if s.ingest?.stream_key}
					<CopyField label="Stream Key" value={s.ingest.stream_key} secret />
				{/if}
				{#if auth.canWrite}
					<button
						class="btn-ghost w-full text-sm"
						onclick={() => rotate.mutate()}
						disabled={rotate.isPending}
					>
						{rotate.isPending ? 'Rotating…' : 'Rotate stream key'}
					</button>
				{/if}
			</div>

			<div class="card space-y-2 p-5 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--color-muted)]">Latency</span><span
						>{s.latency_mode.replace('_', ' ')}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--color-muted)]">Recording</span><span
						>{s.recording_enabled ? 'On' : 'Off'}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--color-muted)]">Created</span><span>{fmtDate(s.created_at)}</span>
				</div>
				<!-- schedule -->
				<div class="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2">
					<span class="text-[var(--color-muted)]">Scheduled</span>
					<div class="flex items-center gap-2">
						{#if s.scheduled_at}
							<ScheduleBadge at={s.scheduled_at} />
							<span class="text-xs">{fmtDate(s.scheduled_at)}</span>
						{:else}
							<span class="text-xs text-[var(--color-muted)]">—</span>
						{/if}
						{#if auth.canWrite}
							<button
								class="text-xs font-medium text-[var(--color-accent)] hover:underline"
								onclick={() => {
									scheduleVal = s.scheduled_at
										? new Date(s.scheduled_at).toISOString().slice(0, 16)
										: '';
									editingSchedule = !editingSchedule;
								}}>{editingSchedule ? 'Close' : 'Edit'}</button
							>
						{/if}
					</div>
				</div>
				{#if editingSchedule}
					<div class="flex flex-wrap items-center gap-2 pt-1">
						<input class="input flex-1" type="datetime-local" bind:value={scheduleVal} />
						<button
							class="btn-primary text-sm"
							disabled={saveSchedule.isPending}
							onclick={() => saveSchedule.mutate(scheduleVal ? new Date(scheduleVal).toISOString() : null)}
							>Save</button
						>
						{#if s.scheduled_at}
							<button class="btn-ghost text-sm" onclick={() => saveSchedule.mutate(null)}>Clear</button>
						{/if}
					</div>
				{/if}
			</div>

			<Restream streamId={id} />

			<Recordings assets={recordings.data?.data ?? []} />
		</div>
	</div>

	<!-- Analytics -->
	<section class="mt-8">
		<div class="mb-3 flex items-center justify-between gap-3">
			<h2 class="text-lg font-medium">Analytics</h2>
			<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
				{#each anRanges as r (r.id)}
					<button
						class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {anRange === r.id
							? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
							: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
						onclick={() => (anRange = r.id)}
					>
						{r.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="mb-4 grid grid-cols-3 gap-3">
			<div class="card p-4">
				<p class="text-xs text-[var(--color-muted)]">Peak viewers</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">
					{analytics.data?.summary.peak_viewers ?? 0}
				</p>
			</div>
			<div class="card p-4">
				<p class="text-xs text-[var(--color-muted)]">Avg startup</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">
					{analytics.data?.summary.avg_startup_ms
						? `${analytics.data.summary.avg_startup_ms}ms`
						: '—'}
				</p>
			</div>
			<div class="card p-4">
				<p class="text-xs text-[var(--color-muted)]">Total rebuffers</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">
					{analytics.data?.summary.total_rebuffers ?? 0}
				</p>
			</div>
		</div>
		<div class="grid gap-4 lg:grid-cols-2">
			<div class="card p-5">
				<h3 class="mb-3 text-sm font-semibold">Concurrent viewers</h3>
				<Chart points={anSeries.map((p) => ({ t: p.t, v: p.viewers }))} color="var(--color-accent)" height={140} />
			</div>
			<div class="card p-5">
				<h3 class="mb-3 text-sm font-semibold">Average bitrate (kbps)</h3>
				<Chart
					points={anSeries.map((p) => ({ t: p.t, v: p.bitrate_kbps }))}
					color="#0ea5e9"
					height={140}
					format={(n) => `${n}k`}
				/>
			</div>
		</div>
	</section>

	<!-- Sessions -->
	<section class="mt-8">
		<h2 class="mb-3 text-lg font-medium">Session history</h2>
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
			{#if (sessions.data?.data ?? []).length === 0}
				<div class="p-6 text-sm text-[var(--color-muted)]">No sessions yet.</div>
			{:else}
				<table class="w-full min-w-[480px] text-sm">
					<thead class="bg-[var(--color-surface-2)] text-left text-[var(--color-muted)]">
						<tr>
							<th class="px-4 py-2 font-medium">Started</th>
							<th class="px-4 py-2 font-medium">Ended</th>
							<th class="px-4 py-2 font-medium">Status</th>
							<th class="px-4 py-2 font-medium">Peak viewers</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-border)]">
						{#each sessions.data?.data ?? [] as sess (sess.id)}
							<tr>
								<td class="px-4 py-2">{fmtDate(sess.started_at)}</td>
								<td class="px-4 py-2">{fmtDate(sess.ended_at)}</td>
								<td class="px-4 py-2">{sess.status}</td>
								<td class="px-4 py-2">{sess.peak_viewers}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			</div>
		</div>
	</section>
{/if}
