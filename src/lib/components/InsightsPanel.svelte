<script lang="ts">
	import type { Insights, Breakdown } from '$lib/types';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import {
		Globe,
		MonitorSmartphone,
		AppWindow,
		Cpu,
		Clapperboard,
		MonitorPlay,
		Gauge
	} from '@lucide/svelte';

	let { insights }: { insights?: Insights } = $props();
	const s = $derived(insights?.summary);

	function dur(ms: number) {
		const sec = Math.round(ms / 1000);
		if (sec < 60) return `${sec}s`;
		const m = Math.floor(sec / 60);
		if (m < 60) return `${m}m ${sec % 60}s`;
		const h = Math.floor(m / 60);
		return `${h}h ${m % 60}m`;
	}
	const pct = (n: number) => `${Math.round((n ?? 0) * 100)}%`;

	const groups = $derived([
		{ label: 'Top countries', icon: Globe, rows: insights?.countries ?? [] },
		{ label: 'Devices', icon: MonitorSmartphone, rows: insights?.devices ?? [] },
		{ label: 'Browsers', icon: AppWindow, rows: insights?.browsers ?? [] },
		{ label: 'Operating systems', icon: Cpu, rows: insights?.oses ?? [] },
		{ label: 'Content type', icon: Clapperboard, rows: insights?.stream_types ?? [] },
		{ label: 'Player', icon: MonitorPlay, rows: insights?.players ?? [] },
		{ label: 'Resolution', icon: Gauge, rows: insights?.resolutions ?? [] }
	]);

	function withMax(rows: Breakdown[]) {
		const max = rows.reduce((m, r) => Math.max(m, r.views), 0) || 1;
		return rows.map((r) => ({ ...r, frac: r.views / max }));
	}
</script>

<!-- engagement KPIs -->
<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
	{#snippet kpi(label: string, value: number, format?: (n: number) => string)}
		<div class="card p-4">
			<p class="text-xs text-[var(--color-muted)]">{label}</p>
			<p class="mt-1 text-xl font-semibold tabular-nums">
				<AnimatedNumber {value} format={format ?? ((n) => Math.round(n).toLocaleString())} />
			</p>
		</div>
	{/snippet}
	{@render kpi('Views', s?.views ?? 0)}
	{@render kpi('Unique viewers', s?.unique_viewers ?? 0)}
	{@render kpi('Watch time', s?.total_watch_ms ?? 0, dur)}
	{@render kpi('Avg view', s?.avg_watch_ms ?? 0, dur)}
	{@render kpi('Completion', (s?.completion_rate ?? 0) * 100, (n) => `${Math.round(n)}%`)}
	{@render kpi('Rebuffer rate', (s?.rebuffer_rate ?? 0) * 100, (n) => `${Math.round(n)}%`)}
</div>

<!-- quality strip -->
<div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-muted)]">
	<span>Avg startup <span class="font-medium text-[var(--color-text)]">{s?.avg_startup_ms ?? 0}ms</span></span>
	<span>Avg bitrate <span class="font-medium text-[var(--color-text)]">{(s?.avg_bitrate_kbps ?? 0).toLocaleString()}k</span></span>
	<span>Rebuffers <span class="font-medium text-[var(--color-text)]">{(s?.total_rebuffers ?? 0).toLocaleString()}</span></span>
	<span>Rebuffer time <span class="font-medium text-[var(--color-text)]">{pct(s?.rebuffer_pct ?? 0)}</span></span>
	<span>Playback errors <span class="font-medium text-[var(--color-text)]">{pct(s?.error_rate ?? 0)}</span></span>
	<span>Exits before start <span class="font-medium text-[var(--color-text)]">{pct(s?.exit_rate ?? 0)}</span></span>
</div>

<!-- dimension breakdowns -->
<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	{#each groups as g (g.label)}
		{@const Icon = g.icon}
		<div class="card p-4">
			<div class="mb-3 flex items-center gap-2 text-sm font-semibold">
				<Icon size={15} class="text-[var(--color-muted)]" />
				{g.label}
			</div>
			{#if g.rows.length === 0}
				<p class="text-xs text-[var(--color-muted)]">No data yet.</p>
			{:else}
				<ul class="space-y-2">
					{#each withMax(g.rows) as row (row.name)}
						<li>
							<div class="mb-0.5 flex items-center justify-between text-xs">
								<span class="truncate">{row.name}</span>
								<span class="tabular-nums text-[var(--color-muted)]">{row.views.toLocaleString()}</span>
							</div>
							<div class="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
								<div
									class="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
									style="width: {Math.max(4, row.frac * 100)}%"
								></div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>
