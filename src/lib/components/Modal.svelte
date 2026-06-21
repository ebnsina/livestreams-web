<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		title = '',
		onClose,
		children
	}: { open?: boolean; title?: string; onClose: () => void; children: Snippet } = $props();

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
		<button class="fixed inset-0 bg-black/40 backdrop-blur-sm" onclick={onClose} aria-label="Close"
		></button>
		<div
			class="card relative z-10 my-auto w-full max-w-2xl"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			<header
				class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5"
			>
				<h2 class="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
				<button
					class="rounded-md p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
					onclick={onClose}
					aria-label="Close dialog"
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</header>
			<div class="max-h-[70vh] overflow-y-auto p-5">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
