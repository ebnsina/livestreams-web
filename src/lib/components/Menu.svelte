<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MoreHorizontal } from '@lucide/svelte';

	let { children, label = 'Actions' }: { children: Snippet; label?: string } = $props();

	let open = $state(false);
	let btn = $state<HTMLButtonElement>();
	let style = $state('');

	function place() {
		if (!btn) return;
		const r = btn.getBoundingClientRect();
		// fixed-position so the menu escapes the table's overflow clipping
		style = `top:${Math.round(r.bottom + 6)}px; right:${Math.round(window.innerWidth - r.right)}px`;
	}
	function toggle(e: MouseEvent) {
		e.stopPropagation();
		if (!open) place();
		open = !open;
	}

	$effect(() => {
		if (!open) return;
		const close = () => (open = false);
		const onDoc = (e: MouseEvent) => {
			if (btn && !btn.contains(e.target as Node)) open = false;
		};
		document.addEventListener('click', onDoc, true);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('click', onDoc, true);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	});
</script>

<button
	bind:this={btn}
	class="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
	aria-label={label}
	aria-haspopup="menu"
	onclick={toggle}
>
	<MoreHorizontal size={18} />
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
		style={style}
		role="menu"
		tabindex="-1"
		onclick={() => (open = false)}
	>
		{@render children()}
	</div>
{/if}
