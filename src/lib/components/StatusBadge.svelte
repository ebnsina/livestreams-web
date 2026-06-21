<script lang="ts">
	import type { StreamStatus } from '$lib/types';
	let { status }: { status: StreamStatus } = $props();
</script>

{#if status === 'live'}
	<span
		class="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400"
	>
		<span class="relative flex h-2 w-2">
			<span
				class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
			></span>
			<span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
		</span>
		LIVE
	</span>
{:else if status === 'errored'}
	<span
		class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400"
	>
		ERROR
	</span>
{:else}
	<span
		class="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400"
	>
		<span class="h-2 w-2 rounded-full bg-slate-500"></span>
		IDLE
	</span>
{/if}
