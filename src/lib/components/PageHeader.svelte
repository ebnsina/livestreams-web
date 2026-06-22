<script lang="ts">
	import type { Component, Snippet } from 'svelte';

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

<header class="mb-6 flex items-start justify-between gap-4">
	<div class="flex items-center gap-3">
		{#if icon}
			{@const Icon = icon}
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff5b3e]/12 text-[#ff5b3e]"
			>
				<Icon size={20} />
			</span>
		{/if}
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
			{#if subtitle}<p class="mt-0.5 text-sm text-[var(--color-muted)]">{subtitle}</p>{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</header>
