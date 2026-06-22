<script lang="ts">
	let {
		value = 0,
		color = '#ff5b3e',
		size = 76,
		stroke = 8,
		label = '',
		sub = ''
	}: { value?: number; color?: string; size?: number; stroke?: number; label?: string; sub?: string } =
		$props();

	const r = $derived((size - stroke) / 2);
	const circ = $derived(2 * Math.PI * r);
	const pct = $derived(Math.min(100, Math.max(0, value)));
	const offset = $derived(circ * (1 - pct / 100));
</script>

<div class="flex flex-col items-center gap-1.5">
	<div class="relative" style="width:{size}px;height:{size}px">
		<svg width={size} height={size} class="-rotate-90">
			<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--color-surface-2)" stroke-width={stroke} />
			<circle
				cx={size / 2}
				cy={size / 2}
				{r}
				fill="none"
				stroke={color}
				stroke-width={stroke}
				stroke-linecap="round"
				stroke-dasharray={circ}
				stroke-dashoffset={offset}
				style="transition: stroke-dashoffset 0.6s ease"
			/>
		</svg>
		<span class="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
			{Math.round(pct)}%
		</span>
	</div>
	{#if label}<p class="text-xs font-medium">{label}</p>{/if}
	{#if sub}<p class="text-[10px] text-[var(--color-muted)]">{sub}</p>{/if}
</div>
