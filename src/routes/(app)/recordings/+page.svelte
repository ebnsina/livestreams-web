<script lang="ts">
	import { page } from '$app/state';
	import { setQuery } from '$lib/urlState';
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
	import { toast } from '$lib/toast.svelte';

	const qc = useQueryClient();
	const LIMIT = 24;
	let clipping = $state<Asset | null>(null);

	// URL is the source of truth for search + filters + pagination
	const sp = $derived(page.url.searchParams);
	const q = $derived(sp.get('q') ?? '');
	const status = $derived(sp.get('status') ?? '');
	const offset = $derived(Number(sp.get('offset') ?? '0') || 0);
	const hasFilters = $derived(!!(q || status));

	let searchInput = $state(page.url.searchParams.get('q') ?? '');
	let searchTimer: ReturnType<typeof setTimeout>;
	function onSearch(v: string) {
		searchInput = v;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => setQuery({ q: v, offset: null }), 300);
	}
	function clearFilters() {
		searchInput = '';
		setQuery({ q: null, status: null, offset: null });
	}

	const assets = createQuery(() => ({
		queryKey: [...keys.assets, 'recording', q, status, offset],
		queryFn: () => api.assets({ q, status, limit: LIMIT, offset, category: 'recording' })
	}));
	const list = $derived(assets.data?.data ?? []);
	const total = $derived(assets.data?.total ?? 0);

	const remove = createMutation(() => ({
		mutationFn: (id: string) => api.deleteAsset(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.assets });
			toast.success('Deleted');
		},
		onError: () => toast.error("Couldn't delete recording — try again")
	}));

	function refresh() {
		qc.invalidateQueries({ queryKey: keys.assets });
	}
</script>

<PageHeader icon={Film} title="Recordings" subtitle="Recorded sessions from your live streams" />

<div class="mb-5 flex flex-wrap items-center gap-2">
	<input
		class="input sm:max-w-xs"
		value={searchInput}
		oninput={(e) => onSearch(e.currentTarget.value)}
		placeholder="Search…"
	/>
	<select class="input w-auto" value={status} onchange={(e) => setQuery({ status: e.currentTarget.value, offset: null })}>
		<option value="">All statuses</option>
		<option value="ready">Ready</option>
		<option value="processing">Processing</option>
		<option value="errored">Errored</option>
	</select>
	{#if hasFilters}
		<button class="btn-ghost text-sm" onclick={clearFilters}>Clear</button>
	{/if}
</div>

{#if assets.isPending}
	<div class="card p-6 text-sm text-[var(--color-muted)]">Loading…</div>
{:else if list.length === 0}
	<div class="card p-10 text-center text-sm text-[var(--color-muted)]">
		{hasFilters ? 'Nothing matches your filters.' : 'No recordings yet. They appear after a stream ends.'}
	</div>
{:else}
	<Recordings
		assets={list}
		onDelete={auth.canWrite ? (id) => remove.mutate(id) : undefined}
		onClip={auth.canWrite ? (a) => (clipping = a) : undefined}
	/>
	<Pager {total} limit={LIMIT} {offset} onChange={(o) => setQuery({ offset: o || null })} />
{/if}

<ClipModal asset={clipping} onClose={() => (clipping = null)} onDone={refresh} />
