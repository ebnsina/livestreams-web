<script lang="ts">
	// A searchable content picker for scoping analytics to a single video/stream
	// (or "All content"). Bind `value` to the selected stream id ('' = all).
	import { scale } from 'svelte/transition';
	import { ChevronsUpDown, Search, Check, Clapperboard } from '@lucide/svelte';

	let {
		items = [],
		value = $bindable('')
	}: { items?: { id: string; name: string }[]; value?: string } = $props();

	let open = $state(false);
	let q = $state('');
	let root = $state<HTMLDivElement>();

	const current = $derived(
		value ? (items.find((i) => i.id === value)?.name ?? 'Unknown video') : 'All content'
	);
	const filtered = $derived(
		q.trim() ? items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : items
	);

	function choose(id: string) {
		value = id;
		open = false;
		q = '';
	}

	$effect(() => {
		if (!open) return;
		const onDoc = (e: MouseEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		document.addEventListener('click', onDoc, true);
		return () => document.removeEventListener('click', onDoc, true);
	});
</script>

<div class="relative" bind:this={root}>
	<button
		class="input flex w-56 items-center gap-2 text-left"
		onclick={() => (open = !open)}
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		<Clapperboard size={15} class="shrink-0 text-[var(--color-muted)]" />
		<span class="flex-1 truncate">{current}</span>
		<ChevronsUpDown size={15} class="shrink-0 text-[var(--color-muted)]" />
	</button>

	{#if open}
		<div
			class="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
			style="transform-origin: top right"
			transition:scale={{ start: 0.92, opacity: 0, duration: 130 }}
			role="listbox"
		>
			<div class="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
				<Search size={14} class="text-[var(--color-muted)]" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={q}
					autofocus
					placeholder="Search videos…"
					class="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
				/>
			</div>
			<ul class="max-h-72 overflow-y-auto py-1">
				<li>
					<button
						class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
						onclick={() => choose('')}
					>
						All content
						{#if value === ''}<Check size={15} class="text-[var(--color-accent)]" />{/if}
					</button>
				</li>
				{#each filtered as item (item.id)}
					<li>
						<button
							class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
							onclick={() => choose(item.id)}
						>
							<span class="truncate">{item.name}</span>
							{#if value === item.id}<Check size={15} class="shrink-0 text-[var(--color-accent)]" />{/if}
						</button>
					</li>
				{/each}
				{#if filtered.length === 0}
					<li class="px-3 py-2 text-sm text-[var(--color-muted)]">No matches.</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>
