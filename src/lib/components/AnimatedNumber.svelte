<script lang="ts">
	// Slot-machine / odometer number. Each digit is a vertical reel (0–9) inside a
	// 1em window with overflow hidden; the reel translates so only the target digit
	// shows, rolling through the digits in between. Non-digits (commas, ".", units)
	// render statically. Respects reduced-motion.
	import { onMount } from 'svelte';

	let {
		value = 0,
		duration = 900,
		format = (n: number) => Math.round(n).toLocaleString()
	}: { value?: number; duration?: number; format?: (n: number) => string } = $props();

	const reduce =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const dur = $derived(reduce ? 0 : duration);

	const text = $derived(format(value));
	const chars = $derived(text.split(''));

	// start the reels at 0, then roll to the target after first paint
	let started = $state(false);
	onMount(() => requestAnimationFrame(() => (started = true)));

	const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<span class="odometer tabular-nums">
	{#each chars as ch, i (i)}
		{#if ch >= '0' && ch <= '9'}
			<span class="window">
				<span
					class="reel"
					style="transform: translateY(-{started ? Number(ch) : 0}em); transition: transform {dur}ms cubic-bezier(0.16, 1, 0.3, 1) {i *
						45}ms;"
				>
					{#each digits as d (d)}<span class="digit">{d}</span>{/each}
				</span>
			</span>
		{:else}
			<span class="sep">{ch}</span>
		{/if}
	{/each}
</span>

<style>
	.odometer {
		display: inline-flex;
		align-items: flex-end;
		line-height: 1;
	}
	.window {
		display: inline-block;
		height: 1em;
		overflow: hidden;
		vertical-align: bottom;
	}
	.reel {
		display: flex;
		flex-direction: column;
		will-change: transform;
	}
	.digit {
		height: 1em;
		line-height: 1;
		text-align: center;
	}
	.sep {
		line-height: 1;
	}
</style>
