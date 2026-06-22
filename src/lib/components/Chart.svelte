<script lang="ts">
	// Dependency-free, professional area/line chart: y-axis + gridlines, smooth
	// (Catmull-Rom) curve, gradient fill, data dots, and an interactive hover
	// crosshair + tooltip. Renders at real pixel size (crisp strokes) and is
	// fully responsive via clientWidth.
	let {
		points,
		color = 'var(--color-accent)',
		height = 160,
		format = (n: number) => `${n}`
	}: {
		points: { t: string; v: number }[];
		color?: string;
		height?: number;
		format?: (n: number) => string;
	} = $props();

	let w = $state(640);
	let hover = $state<number | null>(null);

	const padL = 40;
	const padR = 14;
	const padT = 14;
	const padB = 24;

	const n = $derived(points.length);
	const plotW = $derived(Math.max(1, w - padL - padR));
	const plotH = $derived(Math.max(1, height - padT - padB));

	// nice rounded axis max so gridline labels read cleanly
	function niceCeil(v: number) {
		if (v <= 0) return 1;
		const p = Math.pow(10, Math.floor(Math.log10(v)));
		const f = v / p;
		const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
		return nf * p;
	}
	const max = $derived(niceCeil(Math.max(1, ...points.map((p) => p.v))));

	function px(i: number) {
		return n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
	}
	function py(v: number) {
		return padT + (1 - v / max) * plotH;
	}

	const coords = $derived(points.map((p, i) => ({ x: px(i), y: py(p.v) })));

	// smooth path (Catmull-Rom → cubic bézier)
	const line = $derived.by(() => {
		const c = coords;
		if (c.length === 0) return '';
		if (c.length === 1) return `M ${c[0].x} ${c[0].y}`;
		let d = `M ${c[0].x} ${c[0].y}`;
		for (let i = 0; i < c.length - 1; i++) {
			const p0 = c[i - 1] ?? c[i];
			const p1 = c[i];
			const p2 = c[i + 1];
			const p3 = c[i + 2] ?? p2;
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;
			d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
		}
		return d;
	});
	const area = $derived(
		coords.length ? `${line} L ${coords[n - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z` : ''
	);

	// gridlines / y ticks at 0, ½, 1 of max
	const ticks = $derived([0, max / 2, max]);

	const uid = Math.random().toString(36).slice(2, 8);

	function shortTime(t: string) {
		return new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' });
	}

	function onMove(e: PointerEvent) {
		if (n === 0) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mx = e.clientX - rect.left;
		// nearest point index
		let best = 0;
		let bd = Infinity;
		for (let i = 0; i < n; i++) {
			const d = Math.abs(px(i) - mx);
			if (d < bd) {
				bd = d;
				best = i;
			}
		}
		hover = best;
	}
</script>

{#if n === 0}
	<div
		class="squircle flex items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)]"
		style="height: {height}px"
	>
		No data in this range yet.
	</div>
{:else}
	<div
		class="relative"
		bind:clientWidth={w}
		role="img"
		onpointermove={onMove}
		onpointerleave={() => (hover = null)}
	>
		<svg width={w} height={height} class="block">
			<defs>
				<linearGradient id="grad-{uid}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color={color} stop-opacity="0.22" />
					<stop offset="100%" stop-color={color} stop-opacity="0" />
				</linearGradient>
			</defs>

			<!-- gridlines + y labels -->
			{#each ticks as t (t)}
				<line
					x1={padL}
					x2={w - padR}
					y1={py(t)}
					y2={py(t)}
					stroke="var(--color-border)"
					stroke-width="1"
				/>
				<text
					x={padL - 8}
					y={py(t) + 3}
					text-anchor="end"
					class="fill-[var(--color-muted)] font-mono"
					style="font-size:10px"
				>
					{format(Math.round(t))}
				</text>
			{/each}

			<path d={area} fill="url(#grad-{uid})" />
			<path
				d={line}
				fill="none"
				stroke={color}
				stroke-width="2.5"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>

			<!-- hover crosshair + dot -->
			{#if hover !== null}
				{@const c = coords[hover]}
				<line x1={c.x} x2={c.x} y1={padT} y2={padT + plotH} stroke="var(--color-border)" stroke-width="1" />
				<circle cx={c.x} cy={c.y} r="4" fill={color} stroke="var(--color-surface)" stroke-width="2" />
			{/if}

			<!-- x labels: first / last -->
			<text x={padL} y={height - 6} text-anchor="start" class="fill-[var(--color-muted)] font-mono" style="font-size:10px">
				{shortTime(points[0].t)}
			</text>
			<text x={w - padR} y={height - 6} text-anchor="end" class="fill-[var(--color-muted)] font-mono" style="font-size:10px">
				{shortTime(points[n - 1].t)}
			</text>
		</svg>

		<!-- tooltip -->
		{#if hover !== null}
			{@const c = coords[hover]}
			{@const p = points[hover]}
			<div
				class="squircle pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[var(--color-primary-bg)] px-2.5 py-1.5 text-center text-[var(--color-primary-fg)] shadow-lg"
				style="left: {Math.min(Math.max(c.x, 48), w - 48)}px; top: {c.y - 8}px"
			>
				<p class="text-sm font-semibold tabular-nums leading-none">{format(p.v)}</p>
				<p class="mt-0.5 font-mono text-[10px] opacity-70">{shortTime(p.t)}</p>
			</div>
		{/if}
	</div>
{/if}
