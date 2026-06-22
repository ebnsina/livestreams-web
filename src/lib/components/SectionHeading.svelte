<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	// A consistent in-page section header: small accent icon + title (+ optional
	// subtitle and right-aligned actions). Use for section titles across pages so
	// the visual rhythm is uniform.
	let {
		icon,
		title,
		subtitle = '',
		actions
	}: {
		icon?: Component<{ size?: number | string }>;
		title: string;
		subtitle?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="mb-3 flex items-center justify-between gap-3">
	<div class="flex items-center gap-2">
		{#if icon}
			{@const Icon = icon}
			<span
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
			>
				<Icon size={15} />
			</span>
		{/if}
		<div>
			<h2 class="text-sm font-semibold leading-tight">{title}</h2>
			{#if subtitle}<p class="text-xs text-[var(--color-muted)]">{subtitle}</p>{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</div>
