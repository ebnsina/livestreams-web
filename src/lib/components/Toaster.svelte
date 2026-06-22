<script lang="ts">
	import { toasts } from '$lib/toast.svelte';
	import { CheckCircle2, XCircle, Info, X } from '@lucide/svelte';

	const icon = { success: CheckCircle2, error: XCircle, info: Info };
	const accent = {
		success: 'text-emerald-500',
		error: 'text-red-500',
		info: 'text-sky-500'
	};
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
	{#each toasts.items as t (t.id)}
		{@const Icon = icon[t.kind]}
		<div
			class="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg"
			role="status"
		>
			<Icon size={18} class="mt-0.5 shrink-0 {accent[t.kind]}" />
			<p class="flex-1 text-sm">{t.message}</p>
			<button
				class="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
				onclick={() => toasts.dismiss(t.id)}
				aria-label="Dismiss"
			>
				<X size={15} />
			</button>
		</div>
	{/each}
</div>
