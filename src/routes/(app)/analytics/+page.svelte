<script lang="ts">
	import { page } from '$app/state';
	import { setQuery } from '$lib/urlState';
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import Chart from '$lib/components/Chart.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import InsightsPanel from '$lib/components/InsightsPanel.svelte';
	import BreakdownGrid from '$lib/components/BreakdownGrid.svelte';
	import ContentPicker from '$lib/components/ContentPicker.svelte';
	import { BarChart3, ArrowRight } from '@lucide/svelte';

	// URL is the source of truth for range + scope (so deep links from a stream work)
	const sp = $derived(page.url.searchParams);
	const range = $derived(((sp.get('range') as '24h' | '7d' | '30d') || '24h') as '24h' | '7d' | '30d');
	const scope = $derived(sp.get('stream') ?? ''); // '' = all content, else a stream id
	const isAll = $derived(scope === '');

	const streamList = createQuery(() => ({ queryKey: keys.streams, queryFn: () => api.listStreams() }));
	const pickerItems = $derived((streamList.data?.data ?? []).map((s) => ({ id: s.id, name: s.name })));

	// org-wide
	const overview = createQuery(() => ({
		queryKey: keys.analytics(range),
		queryFn: () => api.analyticsOverview(range),
		refetchInterval: 15000
	}));
	const insights = createQuery(() => ({
		queryKey: ['insights', range],
		queryFn: () => api.insights(range),
		refetchInterval: 30000
	}));

	// per-stream (only fetched when a specific video is picked)
	const streamOverview = createQuery(() => ({
		queryKey: ['streams', scope, 'analytics', range],
		queryFn: () => api.streamAnalytics(scope, range),
		enabled: !isAll,
		refetchInterval: 15000
	}));
	const streamInsights = createQuery(() => ({
		queryKey: ['streams', scope, 'insights', range],
		queryFn: () => api.streamInsights(scope, range),
		enabled: !isAll,
		refetchInterval: 30000
	}));

	const activeInsights = $derived(isAll ? insights.data : streamInsights.data);
	const series = $derived((isAll ? overview.data?.series : streamOverview.data?.series) ?? []);
	const topContent = $derived(insights.data?.top_content ?? []);
	const scopeName = $derived(pickerItems.find((i) => i.id === scope)?.name ?? '');

	const viewers = $derived(series.map((p) => ({ t: p.t, v: p.viewers })));
	const bitrate = $derived(series.map((p) => ({ t: p.t, v: p.bitrate_kbps })));
	const rebuffers = $derived(series.map((p) => ({ t: p.t, v: p.rebuffers })));

	const ranges: { id: '24h' | '7d' | '30d'; label: string }[] = [
		{ id: '24h', label: '24 hours' },
		{ id: '7d', label: '7 days' },
		{ id: '30d', label: '30 days' }
	];

	function bytes(b: number) {
		if (!b) return '0 B';
		const u = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(b) / Math.log(1024));
		return `${(b / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
	}
	function ms(n: number) {
		return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`;
	}
	function dur(msNum: number) {
		const sec = Math.round(msNum / 1000);
		if (sec < 60) return `${sec}s`;
		const m = Math.floor(sec / 60);
		if (m < 60) return `${m}m`;
		return `${Math.floor(m / 60)}h ${m % 60}m`;
	}

	const int = (n: number) => Math.round(n).toLocaleString();
	const data = $derived(overview.data);
	const cards = $derived([
		{ label: 'Peak viewers', value: data?.summary.peak_viewers ?? 0, format: int },
		{ label: 'Live now', value: data?.summary.live_now ?? 0, format: int },
		{ label: 'Avg startup', value: data?.summary.avg_startup_ms ?? 0, format: (n: number) => ms(n) },
		{ label: 'Total rebuffers', value: data?.summary.total_rebuffers ?? 0, format: int },
		{ label: 'Streams', value: data?.summary.streams ?? 0, format: int },
		{ label: 'Recordings', value: data?.summary.recordings ?? 0, format: int },
		{ label: 'VOD & clips', value: data?.summary.vod ?? 0, format: int },
		{ label: 'Storage used', value: data?.summary.storage_bytes ?? 0, format: bytes }
	]);
</script>

<PageHeader
	icon={BarChart3}
	title="Analytics"
	subtitle="Audience and playback quality across your organization"
>
	{#snippet actions()}
		<div class="flex flex-wrap items-center gap-2">
			<ContentPicker
				items={pickerItems}
				value={scope}
				onChange={(id) => setQuery({ stream: id || null })}
			/>
			<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
				{#each ranges as r (r.id)}
					<button
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {range === r.id
							? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
							: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
						onclick={() => setQuery({ range: r.id })}
					>
						{r.label}
					</button>
				{/each}
			</div>
		</div>
	{/snippet}
</PageHeader>

{#if !isAll}
	<div class="mb-5 flex items-center gap-2">
		<a href="/streams/{scope}" class="text-lg font-semibold hover:underline">{scopeName}</a>
		<span class="badge">video</span>
	</div>
{/if}

<div class="space-y-8">
	<!-- engagement headline + quality (scope-aware) -->
	<InsightsPanel insights={activeInsights} />

	<!-- trends: viewers is primary, quality charts secondary -->
	<section>
		<h2 class="mb-3 text-sm font-semibold">Trends</h2>
		<div class="grid gap-4 lg:grid-cols-3">
			<div class="card p-5 lg:col-span-2">
				<h3 class="mb-3 text-sm font-semibold">Concurrent viewers</h3>
				<Chart points={viewers} color="var(--color-accent)" height={200} />
			</div>
			<div class="card p-5">
				<h3 class="mb-3 text-sm font-semibold">Average bitrate</h3>
				<Chart points={bitrate} color="#0ea5e9" height={200} format={(n) => `${n}k`} />
			</div>
			<div class="card p-5 lg:col-span-3">
				<h3 class="mb-3 text-sm font-semibold">Rebuffer events</h3>
				<Chart points={rebuffers} color="#f59e0b" height={120} />
			</div>
		</div>
	</section>

	<!-- breakdowns, grouped -->
	<section>
		<h2 class="mb-3 text-sm font-semibold">Breakdowns</h2>
		<BreakdownGrid insights={activeInsights} />
	</section>

	<!-- top content (all-content only) -->
	{#if isAll && topContent.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold">Top content</h2>
			<div class="card overflow-hidden">
				<table class="w-full text-sm">
					<thead class="bg-[var(--color-surface-2)] text-left text-[var(--color-muted)]">
						<tr>
							<th class="px-4 py-2 font-medium">Video</th>
							<th class="px-4 py-2 text-right font-medium">Views</th>
							<th class="px-4 py-2 text-right font-medium">Unique</th>
							<th class="px-4 py-2 text-right font-medium">Watch time</th>
							<th class="w-8"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-border)]">
						{#each topContent as c (c.stream_id)}
							<tr
								class="cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
								onclick={() => setQuery({ stream: c.stream_id })}
							>
								<td class="truncate px-4 py-2.5 font-medium">{c.name}</td>
								<td class="px-4 py-2.5 text-right tabular-nums">{c.views.toLocaleString()}</td>
								<td class="px-4 py-2.5 text-right tabular-nums">{c.unique_viewers.toLocaleString()}</td>
								<td class="px-4 py-2.5 text-right tabular-nums">{dur(c.total_watch_ms)}</td>
								<td class="px-2 text-[var(--color-muted)]"><ArrowRight size={14} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- library & infrastructure (org-wide footer band) -->
	{#if isAll}
		<section>
			<h2 class="mb-3 text-sm font-semibold">Library &amp; infrastructure</h2>
			<div class="card flex flex-wrap divide-y divide-[var(--color-border)] p-0 sm:divide-x sm:divide-y-0">
				{#each cards as c (c.label)}
					<div class="min-w-[50%] flex-1 px-5 py-4 sm:min-w-[120px]">
						<p class="text-xs text-[var(--color-muted)]">{c.label}</p>
						<p class="mt-1 text-xl font-semibold tabular-nums">
							<AnimatedNumber value={c.value} format={c.format} />
						</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

{#if overview.isPending}
	<p class="mt-4 text-sm text-[var(--color-muted)]">Loading…</p>
{/if}
