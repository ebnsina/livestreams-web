<script lang="ts">
	// Lightweight dependency-free area/line chart. Renders into a fixed viewBox
	// and scales to the container width (non-scaling stroke keeps lines crisp).
	let {
		points,
		color = '#ff5b3e',
		height = 160,
		format = (n: number) => `${n}`
	}: {
		points: { t: string; v: number }[];
		color?: string;
		height?: number;
		format?: (n: number) => string;
	} = $props();

	const W = 640;
	const H = 180;
	const PAD = 8;

	const max = $derived(Math.max(1, ...points.map((p) => p.v)));
	const n = $derived(points.length);

	function x(i: number) {
		if (n <= 1) return PAD;
		return PAD + (i / (n - 1)) * (W - PAD * 2);
	}
	function y(v: number) {
		return H - PAD - (v / max) * (H - PAD * 2);
	}

	const line = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.v)}`).join(' '));
	const area = $derived(
		n > 0 ? `${line} L ${x(n - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z` : ''
	);

	const uid = Math.random().toString(36).slice(2, 8);

	function label(t: string) {
		const d = new Date(t);
		return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' });
	}
</script>

{#if n === 0}
	<div
		class="flex items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted)]"
		style="height: {height}px"
	>
		No data in this range yet.
	</div>
{:else}
	<div>
		<svg
			viewBox="0 0 {W} {H}"
			preserveAspectRatio="none"
			class="w-full"
			style="height: {height}px"
			role="img"
		>
			<defs>
				<linearGradient id="grad-{uid}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color={color} stop-opacity="0.25" />
					<stop offset="100%" stop-color={color} stop-opacity="0" />
				</linearGradient>
			</defs>
			<path d={area} fill="url(#grad-{uid})" />
			<path
				d={line}
				fill="none"
				stroke={color}
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
		<div class="mt-1 flex justify-between font-mono text-[10px] text-[var(--color-muted)]">
			<span>{label(points[0].t)}</span>
			<span>peak {format(max)}</span>
			<span>{label(points[n - 1].t)}</span>
		</div>
	</div>
{/if}
