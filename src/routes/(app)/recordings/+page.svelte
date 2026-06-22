<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import type { Asset } from '$lib/types';
	import Recordings from '$lib/components/Recordings.svelte';
	import ClipModal from '$lib/components/ClipModal.svelte';
	import Pager from '$lib/components/Pager.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Film } from '@lucide/svelte';

	const qc = useQueryClient();
	const LIMIT = 24;
	let q = $state('');
	let offset = $state(0);
	let clipping = $state<Asset | null>(null);

	$effect(() => {
		void q;
		offset = 0;
	});

	const assets = createQuery(() => ({
		queryKey: [...keys.assets, 'recording', q, offset],
		queryFn: () => api.assets({ q, limit: LIMIT, offset, category: 'recording' })
	}));
	const list = $derived(assets.data?.data ?? []);
	const total = $derived(assets.data?.total ?? 0);

	const remove = createMutation(() => ({
		mutationFn: (id: string) => api.deleteAsset(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.assets })
	}));

	function refresh() {
		qc.invalidateQueries({ queryKey: keys.assets });
	}
</script>

<PageHeader icon={Film} title="Recordings" subtitle="Recorded sessions from your live streams" />

<div class="mb-5">
	<input class="input sm:max-w-xs" bind:value={q} placeholder="Search…" />
</div>

{#if assets.isPending}
	<div class="card p-6 text-sm text-[var(--color-muted)]">Loading…</div>
{:else if list.length === 0}
	<div class="card p-10 text-center text-sm text-[var(--color-muted)]">
		{q ? 'Nothing matches your search.' : 'No recordings yet. They appear after a stream ends.'}
	</div>
{:else}
	<Recordings
		assets={list}
		onDelete={auth.canWrite ? (id) => remove.mutate(id) : undefined}
		onClip={auth.canWrite ? (a) => (clipping = a) : undefined}
	/>
	<Pager {total} limit={LIMIT} {offset} onChange={(o) => (offset = o)} />
{/if}

<ClipModal asset={clipping} onClose={() => (clipping = null)} onDone={refresh} />
