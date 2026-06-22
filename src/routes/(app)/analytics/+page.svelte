<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import Chart from '$lib/components/Chart.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import InsightsPanel from '$lib/components/InsightsPanel.svelte';
	import { BarChart3 } from '@lucide/svelte';

	let range = $state<'24h' | '7d' | '30d'>('24h');

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

	const data = $derived(overview.data);
	const series = $derived(data?.series ?? []);

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

	const int = (n: number) => Math.round(n).toLocaleString();
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
		<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
			{#each ranges as r (r.id)}
				<button
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {range === r.id
						? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
						: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
					onclick={() => (range = r.id)}
				>
					{r.label}
				</button>
			{/each}
		</div>
	{/snippet}
</PageHeader>

<!-- summary cards -->
<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
	{#each cards as c (c.label)}
		<div class="card p-4">
			<p class="text-xs text-[var(--color-muted)]">{c.label}</p>
			<p class="mt-1 text-2xl font-semibold">
				<AnimatedNumber value={c.value} format={c.format} />
			</p>
		</div>
	{/each}
</div>

<!-- audience & engagement -->
<section class="mb-6">
	<h2 class="mb-3 text-sm font-semibold">Audience &amp; engagement</h2>
	<InsightsPanel insights={insights.data} />
</section>

<!-- charts -->
<div class="grid gap-4 lg:grid-cols-2">
	<section class="card p-5">
		<h2 class="mb-3 text-sm font-semibold">Concurrent viewers</h2>
		<Chart points={viewers} color="var(--color-accent)" />
	</section>
	<section class="card p-5">
		<h2 class="mb-3 text-sm font-semibold">Average bitrate (kbps)</h2>
		<Chart points={bitrate} color="#0ea5e9" format={(n) => `${n}k`} />
	</section>
	<section class="card p-5 lg:col-span-2">
		<h2 class="mb-3 text-sm font-semibold">Rebuffer events</h2>
		<Chart points={rebuffers} color="#f59e0b" height={140} />
	</section>
</div>

{#if overview.isPending}
	<p class="mt-4 text-sm text-[var(--color-muted)]">Loading…</p>
{/if}
