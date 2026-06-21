<script lang="ts">
	import type { StreamEvent } from '$lib/types';

	let { events, live = false }: { events: StreamEvent[]; live?: boolean } = $props();

	// Soft-tint level pills (single colors that read on both light and dark).
	const pill: Record<string, string> = {
		info: 'bg-sky-500/12 text-sky-500',
		warn: 'bg-amber-500/12 text-amber-500',
		error: 'bg-red-500/12 text-red-500'
	};
	const dot: Record<string, string> = {
		info: 'bg-sky-400',
		warn: 'bg-amber-400',
		error: 'bg-red-500'
	};

	function clock(s: string) {
		return new Date(s).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function detail(e: StreamEvent): string {
		const d = e.data as Record<string, unknown> | undefined;
		if (!d) return '';
		if (d.renditions) return (d.renditions as string[]).join(' · ');
		if (d.size_bytes) return `${Math.round(Number(d.size_bytes) / 1024)} KB`;
		if (d.bitrate_kbps !== undefined) return `${d.bitrate_kbps} kbps`;
		if (d.codec) return `codec: ${d.codec}`;
		if (d.error) return String(d.error);
		if (d.ingest_ip) return `from ${d.ingest_ip}`;
		return '';
	}
</script>

<section class="card overflow-hidden">
	<!-- header -->
	<div
		class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5"
	>
		<div class="flex items-center gap-2">
			<span class="text-[13px] font-semibold tracking-[-0.01em]">Activity</span>
			{#if live}
				<span class="relative ml-0.5 flex h-1.5 w-1.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"
					></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				</span>
				<span class="font-mono text-[11px] text-emerald-500">live</span>
			{/if}
		</div>
		<span class="font-mono text-[11px] text-[var(--color-muted)] tabular-nums"
			>{events.length} event{events.length === 1 ? '' : 's'}</span
		>
	</div>

	{#if events.length === 0}
		<div class="px-5 py-10 text-center text-sm text-[var(--color-muted)]">No activity yet.</div>
	{:else}
		<ul class="divide-y divide-[var(--color-border)]">
			{#each events as e (e.id)}
				<li
					class="grid grid-cols-[10px_1fr_auto] items-start gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
				>
					<span class="mt-[7px] h-2 w-2 shrink-0 rounded-full {dot[e.level] ?? 'bg-slate-400'}"></span>

					<div class="min-w-0">
						<p
							class="truncate text-[13px] font-medium {e.level === 'error'
								? 'text-red-500'
								: 'text-[var(--color-text)]'}"
						>
							{e.message}
						</p>
						<div class="mt-1 flex min-w-0 items-center gap-2">
							<span
								class="shrink-0 rounded px-1.5 py-px font-mono text-[10px] font-medium {pill[
									e.level
								] ?? 'bg-slate-500/12 text-slate-400'}"
							>
								{e.type}
							</span>
							{#if detail(e)}
								<span class="truncate font-mono text-[11px] text-[var(--color-muted)]">{detail(e)}</span>
							{/if}
						</div>
					</div>

					<time class="mt-px shrink-0 font-mono text-[11px] tabular-nums text-[var(--color-muted)]"
						>{clock(e.created_at)}</time
					>
				</li>
			{/each}
		</ul>
	{/if}
</section>
