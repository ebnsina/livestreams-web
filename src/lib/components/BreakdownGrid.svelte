<script lang="ts">
	import type { Insights, Breakdown } from '$lib/types';
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

	// breakdowns grouped into meaningful clusters so it reads as sections, not a
	// flat wall of identical cards
	const clusters = $derived([
		{
			title: 'Audience',
			groups: [
				{ label: 'Top countries', icon: Globe, rows: insights?.countries ?? [] },
				{ label: 'Devices', icon: MonitorSmartphone, rows: insights?.devices ?? [] }
			]
		},
		{
			title: 'Technology',
			groups: [
				{ label: 'Browsers', icon: AppWindow, rows: insights?.browsers ?? [] },
				{ label: 'Operating systems', icon: Cpu, rows: insights?.oses ?? [] },
				{ label: 'Player', icon: MonitorPlay, rows: insights?.players ?? [] }
			]
		},
		{
			title: 'Playback',
			groups: [
				{ label: 'Content type', icon: Clapperboard, rows: insights?.stream_types ?? [] },
				{ label: 'Resolution', icon: Gauge, rows: insights?.resolutions ?? [] }
			]
		}
	]);

	function ranked(rows: Breakdown[]) {
		const total = rows.reduce((sum, r) => sum + r.views, 0) || 1;
		return rows.map((r) => ({ ...r, frac: r.views / total }));
	}
</script>

<div class="space-y-6">
	{#each clusters as cluster (cluster.title)}
		<div>
			<h3 class="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
				{cluster.title}
			</h3>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each cluster.groups as g (g.label)}
					{@const Icon = g.icon}
					{@const rows = ranked(g.rows)}
					<div class="card p-4">
						<div class="mb-3 flex items-center gap-2 text-sm font-semibold">
							<Icon size={15} class="text-[var(--color-muted)]" />
							{g.label}
						</div>
						{#if rows.length === 0}
							<p class="text-xs text-[var(--color-muted)]">No data yet.</p>
						{:else}
							<ul class="space-y-2.5">
								{#each rows as row (row.name)}
									<li>
										<div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
											<span class="truncate font-medium">{row.name}</span>
											<span class="shrink-0 tabular-nums text-[var(--color-muted)]">
												{Math.round(row.frac * 100)}%
												<span class="ml-1 opacity-60">{row.views.toLocaleString()}</span>
											</span>
										</div>
										<div class="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
											<div
												class="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
												style="width: {Math.max(3, row.frac * 100)}%"
											></div>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
