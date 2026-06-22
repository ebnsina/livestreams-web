<script lang="ts">
	import { CalendarClock } from '@lucide/svelte';

	let { at }: { at?: string | null } = $props();

	// tick every 30s so the countdown stays fresh
	let now = $state(Date.now());
	$effect(() => {
		const t = setInterval(() => (now = Date.now()), 30000);
		return () => clearInterval(t);
	});

	const ms = $derived(at ? new Date(at).getTime() - now : NaN);
	const soon = $derived(!isNaN(ms) && ms <= 5 * 60_000); // within 5 min (or past)

	function rel(d: number) {
		if (d <= 60_000) return 'starting soon';
		const m = Math.floor(d / 60_000);
		if (m < 60) return `in ${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `in ${h}h ${m % 60}m`;
		return `in ${Math.floor(h / 24)}d ${h % 24}h`;
	}
</script>

{#if at && !isNaN(ms)}
	<span
		class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium {soon
			? 'bg-amber-500/15 text-amber-600'
			: 'bg-sky-500/12 text-sky-600'}"
		title={new Date(at).toLocaleString()}
	>
		<CalendarClock size={12} />
		{ms <= 0 ? 'starting soon' : rel(ms)}
	</span>
{/if}
