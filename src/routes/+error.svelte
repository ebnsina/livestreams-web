<script lang="ts">
	import { page } from '$app/state';
	import { Compass, RotateCcw } from '@lucide/svelte';

	const status = $derived(page.status);
	const is404 = $derived(status === 404);
	const title = $derived(
		is404 ? 'Page not found' : status >= 500 ? 'Something went wrong' : 'Something went wrong'
	);
	const message = $derived(
		is404
			? "The page you're looking for doesn't exist or may have moved."
			: (page.error?.message ?? 'An unexpected error occurred. Please try again.')
	);
</script>

<svelte:head><title>{status} · Livestreams</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
	<div class="card squircle w-full max-w-md p-8 text-center">
		<div
			class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
		>
			<Compass size={26} />
		</div>
		<p class="font-mono text-sm text-[var(--color-muted)]">{status}</p>
		<h1 class="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
		<p class="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">{message}</p>

		<div class="mt-6 flex items-center justify-center gap-2">
			<a href="/dashboard" class="btn-primary">Go to dashboard</a>
			{#if !is404}
				<button class="btn-ghost" onclick={() => location.reload()}>
					<RotateCcw size={16} /> Try again
				</button>
			{/if}
		</div>
	</div>
</div>
