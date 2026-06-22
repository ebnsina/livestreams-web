<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import type { Asset } from '$lib/types';
	import UploadVOD from '$lib/components/UploadVOD.svelte';
	import ClipModal from '$lib/components/ClipModal.svelte';
	import TranscodeDetail from '$lib/components/TranscodeDetail.svelte';
	import PlayerModal from '$lib/components/PlayerModal.svelte';
	import EmbedSnippet from '$lib/components/EmbedSnippet.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import Pager from '$lib/components/Pager.svelte';
	import { UploadCloud, Play, ScrollText, RefreshCw, Trash2 } from '@lucide/svelte';

	const qc = useQueryClient();
	const LIMIT = 20;
	const key = (q: string, o: number) => ['transcodes', q, o];

	let q = $state('');
	let offset = $state(0);
	let showUpload = $state(false);
	let detail = $state<Asset | null>(null);
	let playing = $state<Asset | null>(null);
	let clipping = $state<Asset | null>(null);
	let embedding = $state<Asset | null>(null);

	$effect(() => {
		void q;
		offset = 0;
	});

	const list = createQuery(() => ({
		queryKey: key(q, offset),
		queryFn: () => api.assets({ q, limit: LIMIT, offset, category: 'transcode' }),
		refetchInterval: 5000
	}));
	const items = $derived(list.data?.data ?? []);
	const total = $derived(list.data?.total ?? 0);

	function refresh() {
		qc.invalidateQueries({ queryKey: ['transcodes'] });
	}
	const remove = createMutation(() => ({
		mutationFn: (id: string) => api.deleteAsset(id),
		onSuccess: refresh
	}));
	const retry = createMutation(() => ({
		mutationFn: (id: string) => api.retryAsset(id),
		onSuccess: refresh
	}));

	const typeLabel: Record<string, string> = { vod: 'VOD', clip: 'Clip', upload: 'Upload' };
	const statusColor: Record<string, string> = {
		ready: 'bg-emerald-500/12 text-emerald-600',
		processing: 'bg-[#ff5b3e]/12 text-[#ff5b3e]',
		uploading: 'bg-amber-500/12 text-amber-600',
		pending: 'bg-slate-500/12 text-slate-500',
		errored: 'bg-red-500/12 text-red-600'
	};
	function mb(b: number) {
		if (!b) return '—';
		const m = b / 1024 / 1024;
		return m >= 1 ? `${m.toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
	}
	function dur(s: number) {
		if (!s) return '—';
		const m = Math.floor(s / 60);
		return `${m}:${(s % 60).toString().padStart(2, '0')}`;
	}
	function when(s: string) {
		return new Date(s).toLocaleString();
	}
</script>

<header class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold">Transcodes</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">Uploaded videos and clips processed into adaptive HLS</p>
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

<div class="card overflow-x-auto">
	{#if list.isPending}
		<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
	{:else if items.length === 0}
		<div class="p-10 text-center text-sm text-[var(--color-muted)]">
			{q ? 'Nothing matches your search.' : 'No transcodes yet. Upload a video to get started.'}
		</div>
	{:else}
		<table class="w-full min-w-[720px] text-sm">
			<thead
				class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
			>
				<tr>
					<th class="px-4 py-2.5">Title</th>
					<th class="px-4 py-2.5">Type</th>
					<th class="px-4 py-2.5">Status</th>
					<th class="px-4 py-2.5">Duration</th>
					<th class="px-4 py-2.5">Size</th>
					<th class="px-4 py-2.5">Created</th>
					<th class="px-4 py-2.5"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-border)]">
				{#each items as a (a.id)}
					<tr class="transition-colors hover:bg-[var(--color-surface-2)]">
						<td class="px-4 py-2.5">
							<div class="flex items-center gap-3">
								{#if a.thumbnail}
									<img
										src={api.thumbnailUrl(a.id)}
										alt=""
										loading="lazy"
										class="h-9 w-16 shrink-0 rounded bg-[var(--color-surface-2)] object-cover"
									/>
								{:else}
									<div class="h-9 w-16 shrink-0 rounded bg-[var(--color-surface-2)]"></div>
								{/if}
								<span class="max-w-[220px] truncate font-medium">{a.title}</span>
							</div>
						</td>
						<td class="px-4 py-2.5 text-[var(--color-muted)]">{typeLabel[a.type] ?? a.type}</td>
						<td class="px-4 py-2.5">
							<span class="rounded px-1.5 py-0.5 text-[11px] font-medium {statusColor[a.status] ?? ''}"
								>{a.status}</span
							>
						</td>
						<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{dur(a.duration_sec)}</td>
						<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{mb(a.size_bytes)}</td>
						<td class="px-4 py-2.5 text-[12px] text-[var(--color-muted)]">{when(a.created_at)}</td>
						<td class="px-4 py-2.5">
							<div class="flex justify-end">
								<Menu>
									<button class="menu-item" disabled={a.status !== 'ready'} onclick={() => (playing = a)}>
										<Play size={15} /> Play
									</button>
									<button class="menu-item" onclick={() => (detail = a)}>
										<ScrollText size={15} /> Details
									</button>
									{#if auth.canWrite && a.type !== 'clip' && a.status !== 'processing' && a.status !== 'uploading'}
										<button class="menu-item" onclick={() => retry.mutate(a.id)}>
											<RefreshCw size={15} />
											{a.status === 'errored' ? 'Retry' : 'Re-transcode'}
										</button>
									{/if}
									{#if auth.canWrite}
										<button class="menu-item text-red-600" onclick={() => remove.mutate(a.id)}>
											<Trash2 size={15} /> Delete
										</button>
									{/if}
								</Menu>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<Pager {total} limit={LIMIT} {offset} onChange={(o) => (offset = o)} />

<PlayerModal asset={playing} onClose={() => (playing = null)} />
<UploadVOD open={showUpload} onClose={() => (showUpload = false)} onDone={refresh} />
<ClipModal asset={clipping} onClose={() => (clipping = null)} onDone={refresh} />
<TranscodeDetail
	asset={detail}
	onClose={() => (detail = null)}
	onRetry={auth.canWrite ? (id) => retry.mutate(id) : undefined}
	onClip={auth.canWrite ? (a) => ((clipping = a), (detail = null)) : undefined}
	onEmbed={(a) => {
		detail = null;
		embedding = a;
	}}
/>

<Modal open={!!embedding} title="Embed video" onClose={() => (embedding = null)}>
	{#if embedding}
		<EmbedSnippet id={embedding.id} kind="vod" />
	{/if}
</Modal>
