<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import Recordings from '$lib/components/Recordings.svelte';

	const qc = useQueryClient();
	let q = $state('');

	const assets = createQuery(() => ({ queryKey: keys.assets, queryFn: () => api.assets() }));
	const all = $derived(assets.data?.data ?? []);
	const filtered = $derived(
		q.trim() ? all.filter((a) => a.title.toLowerCase().includes(q.trim().toLowerCase())) : all
	);

	const remove = createMutation(() => ({
		mutationFn: (id: string) => api.deleteAsset(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.assets })
	}));
</script>

<header class="mb-6">
	<h1 class="text-2xl font-semibold">Recordings</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">Every recorded session across your account</p>
</header>

<div class="mb-5">
	<input class="input sm:max-w-xs" bind:value={q} placeholder="Search recordings…" />
</div>

{#if assets.isPending}
	<div class="card p-6 text-sm text-[var(--color-muted)]">Loading…</div>
{:else if filtered.length === 0}
	<div class="card p-10 text-center text-sm text-[var(--color-muted)]">
		{q ? 'No recordings match your search.' : 'No recordings yet. They appear after a stream ends.'}
	</div>
{:else}
	<Recordings assets={filtered} onDelete={(id) => remove.mutate(id)} />
{/if}
