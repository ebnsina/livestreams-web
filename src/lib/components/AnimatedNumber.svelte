<script lang="ts">
	// Count-up number animation (YouTube-style). Tweens from its current value to
	// the new one whenever it changes, using Svelte's built-in motion. Respects
	// reduced-motion by snapping instantly.
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let {
		value = 0,
		duration = 700,
		format = (n: number) => Math.round(n).toLocaleString()
	}: { value?: number; duration?: number; format?: (n: number) => string } = $props();

	const reduce =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	const t = new Tween(0, { duration: reduce ? 0 : untrack(() => duration), easing: cubicOut });
	$effect(() => {
		t.set(value);
	});
</script>

<span class="tabular-nums">{format(t.current)}</span>
