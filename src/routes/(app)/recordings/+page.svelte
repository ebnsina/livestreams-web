<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import type { Asset } from '$lib/types';
	import Recordings from '$lib/components/Recordings.svelte';
	import UploadVOD from '$lib/components/UploadVOD.svelte';
	import ClipModal from '$lib/components/ClipModal.svelte';
	import EmbedSnippet from '$lib/components/EmbedSnippet.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Pager from '$lib/components/Pager.svelte';
	import { UploadCloud } from '@lucide/svelte';

	const qc = useQueryClient();
	const LIMIT = 24;
	let q = $state('');
	let offset = $state(0);
	let showUpload = $state(false);
	let clipping = $state<Asset | null>(null);
	let embedding = $state<Asset | null>(null);

	$effect(() => {
		void q;
		offset = 0;
	});

	const assets = createQuery(() => ({
		queryKey: [...keys.assets, q, offset],
		queryFn: () => api.assets({ q, limit: LIMIT, offset }),
		// keep status fresh while uploads/clips transcode in the background
		refetchInterval: 5000
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

<header class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold">Recordings &amp; VOD</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">
			Recorded sessions, uploaded videos, and clips across your account
		</p>
	</div>
	{#if auth.canWrite}
		<button class="btn-primary inline-flex items-center gap-2" onclick={() => (showUpload = true)}>
			<UploadCloud size={16} /> Upload video
		</button>
	{/if}
</header>

<div class="mb-5">
	<input class="input sm:max-w-xs" bind:value={q} placeholder="Search…" />
</div>

{#if assets.isPending}
	<div class="card p-6 text-sm text-[var(--color-muted)]">Loading…</div>
{:else if list.length === 0}
	<div class="card p-10 text-center text-sm text-[var(--color-muted)]">
		{q ? 'Nothing matches your search.' : 'No recordings or videos yet. Upload one to get started.'}
	</div>
{:else}
	<Recordings
		assets={list}
		onDelete={auth.canWrite ? (id) => remove.mutate(id) : undefined}
		onClip={auth.canWrite ? (a) => (clipping = a) : undefined}
		onEmbed={(a) => (embedding = a)}
	/>
	<Pager {total} limit={LIMIT} {offset} onChange={(o) => (offset = o)} />
{/if}

<UploadVOD open={showUpload} onClose={() => (showUpload = false)} onDone={refresh} />
<ClipModal asset={clipping} onClose={() => (clipping = null)} onDone={refresh} />
<Modal open={!!embedding} title="Embed video" onClose={() => (embedding = null)}>
	{#if embedding}
		<EmbedSnippet id={embedding.id} kind="vod" />
	{/if}
</Modal>
