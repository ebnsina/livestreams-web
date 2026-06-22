<script lang="ts">
	let { state }: { state: string } = $props();

	// River job states → soft-tint badge styles.
	const styles: Record<string, string> = {
		completed: 'bg-emerald-500/12 text-emerald-500',
		running: 'bg-sky-500/12 text-sky-500',
		available: 'bg-slate-500/12 text-slate-400',
		scheduled: 'bg-slate-500/12 text-slate-400',
		retryable: 'bg-amber-500/12 text-amber-500',
		discarded: 'bg-red-500/12 text-red-500',
		cancelled: 'bg-slate-500/12 text-slate-400'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-tight {styles[
		state
	] ?? 'bg-slate-500/12 text-slate-400'}"
>
	{#if state === 'running'}
		<span class="relative flex h-1.5 w-1.5">
			<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-75"
			></span>
			<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500"></span>
		</span>
	{/if}
	{state}
</span>
