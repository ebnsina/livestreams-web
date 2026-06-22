<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		title = '',
		subtitle = '',
		children
	}: {
		open?: boolean;
		title?: string;
		subtitle?: string;
		children: Snippet;
	} = $props();

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	// lock body scroll while open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
			return () => (document.body.style.overflow = '');
		}
	});
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- backdrop -->
		<button
			class="absolute inset-0 bg-[var(--color-text)]/30 backdrop-blur-sm"
			onclick={close}
			aria-label="Close dialog"
			tabindex="-1"
			transition:fade={{ duration: 150 }}
		></button>

		<!-- panel -->
		<div
			class="card squircle relative z-10 w-full max-w-md p-6"
			style="box-shadow: var(--shadow-pop)"
			role="dialog"
			aria-modal="true"
			transition:scale={{ start: 0.96, opacity: 0, duration: 180 }}
		>
			<div class="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold tracking-tight">{title}</h2>
					{#if subtitle}<p class="mt-0.5 text-sm text-[var(--color-muted)]">{subtitle}</p>{/if}
				</div>
				<button
					class="squircle -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
					onclick={close}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
