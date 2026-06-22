<script lang="ts">
	import { ApiError } from '$lib/api';
	import { AlertTriangle, RotateCcw, SearchX } from '@lucide/svelte';

	let {
		error,
		title = '',
		onRetry
	}: { error?: unknown; title?: string; onRetry?: () => void } = $props();

	const status = $derived(error instanceof ApiError ? error.status : undefined);
	const notFound = $derived(status === 404);
	const heading = $derived(title || (notFound ? 'Not found' : "Couldn't load this"));
	const message = $derived(
		error instanceof Error && error.message
			? error.message
			: 'Please try again in a moment.'
	);
</script>

<div class="card squircle p-8 text-center">
	<div
		class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl {notFound
			? 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
			: 'bg-red-500/10 text-red-500'}"
	>
		{#if notFound}<SearchX size={20} />{:else}<AlertTriangle size={20} />{/if}
	</div>
	<p class="font-medium">{heading}</p>
	<p class="mx-auto mt-1 max-w-sm text-sm text-[var(--color-muted)]">{message}</p>
	{#if onRetry && !notFound}
		<button class="btn-ghost mt-4" onclick={onRetry}>
			<RotateCcw size={15} /> Try again
		</button>
	{/if}
</div>
