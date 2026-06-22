<script lang="ts">
	import type { Insights } from '$lib/types';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';

	let { insights }: { insights?: Insights } = $props();
	const s = $derived(insights?.summary);

	function dur(ms: number) {
		const sec = Math.round((ms ?? 0) / 1000);
		if (sec < 60) return `${sec}s`;
		const m = Math.floor(sec / 60);
		if (m < 60) return `${m}m ${sec % 60}s`;
		return `${Math.floor(m / 60)}h ${m % 60}m`;
	}
	const int = (n: number) => Math.round(n).toLocaleString();
	const pct = (n: number) => `${Math.round(n)}%`;

	// headline engagement metrics — one unified band, not separate cards
	const stats = $derived([
		{ label: 'Views', value: s?.views ?? 0, format: int },
		{ label: 'Unique viewers', value: s?.unique_viewers ?? 0, format: int },
		{ label: 'Watch time', value: s?.total_watch_ms ?? 0, format: dur },
		{ label: 'Avg view', value: s?.avg_watch_ms ?? 0, format: dur },
		{ label: 'Completion', value: (s?.completion_rate ?? 0) * 100, format: pct },
		{ label: 'Rebuffer rate', value: (s?.rebuffer_rate ?? 0) * 100, format: pct }
	]);

	// quality-of-experience — compact chips
	const quality = $derived([
		{ label: 'Avg startup', value: `${s?.avg_startup_ms ?? 0}ms` },
		{ label: 'Avg bitrate', value: `${(s?.avg_bitrate_kbps ?? 0).toLocaleString()}k` },
		{ label: 'Rebuffers', value: (s?.total_rebuffers ?? 0).toLocaleString() },
		{ label: 'Rebuffer time', value: pct((s?.rebuffer_pct ?? 0) * 100) },
		{ label: 'Playback errors', value: pct((s?.error_rate ?? 0) * 100) },
		{ label: 'Exits before start', value: pct((s?.exit_rate ?? 0) * 100) }
	]);
</script>

<div class="card overflow-hidden p-0">
	<!-- engagement band -->
	<div class="flex flex-wrap divide-y divide-[var(--color-border)] sm:divide-x sm:divide-y-0">
		{#each stats as st (st.label)}
			<div class="min-w-[50%] flex-1 px-5 py-4 sm:min-w-[150px]">
				<p class="text-xs text-[var(--color-muted)]">{st.label}</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">
					<AnimatedNumber value={st.value} format={st.format} />
				</p>
			</div>
		{/each}
	</div>
	<!-- quality strip -->
	<div class="flex flex-wrap gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-5 py-3">
		{#each quality as q (q.label)}
			<span class="inline-flex items-center gap-1.5 text-xs">
				<span class="text-[var(--color-muted)]">{q.label}</span>
				<span class="font-semibold tabular-nums">{q.value}</span>
			</span>
			<span class="text-[var(--color-border)] last:hidden">·</span>
		{/each}
	</div>
</div>
