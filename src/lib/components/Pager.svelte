<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	let {
		total,
		limit,
		offset,
		onChange
	}: { total: number; limit: number; offset: number; onChange: (offset: number) => void } = $props();

	const from = $derived(total === 0 ? 0 : offset + 1);
	const to = $derived(Math.min(offset + limit, total));
	const canPrev = $derived(offset > 0);
	const canNext = $derived(offset + limit < total);
</script>

{#if total > limit}
	<div class="mt-4 flex items-center justify-between gap-3">
		<p class="text-xs text-[var(--color-muted)]">
			Showing <span class="font-mono tabular-nums">{from}–{to}</span> of
			<span class="font-mono tabular-nums">{total}</span>
		</p>
		<div class="flex items-center gap-2">
			<button
				class="btn-ghost px-2 py-1 text-sm disabled:opacity-40"
				onclick={() => onChange(Math.max(0, offset - limit))}
				disabled={!canPrev}
				aria-label="Previous page"
			>
				<ChevronLeft size={16} />
			</button>
			<button
				class="btn-ghost px-2 py-1 text-sm disabled:opacity-40"
				onclick={() => onChange(offset + limit)}
				disabled={!canNext}
				aria-label="Next page"
			>
				<ChevronRight size={16} />
			</button>
		</div>
	</div>
{/if}
