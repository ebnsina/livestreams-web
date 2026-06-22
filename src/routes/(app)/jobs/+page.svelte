<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import type { Job } from '$lib/types';
	import JobStateBadge from '$lib/components/JobStateBadge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Cpu } from '@lucide/svelte';

	let streamFilter = $state('');
	let search = $state('');
	let selected = $state<Job | null>(null);

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams()
	}));
	const jobs = createQuery(() => ({
		queryKey: keys.jobs,
		queryFn: () => api.jobs(),
		refetchInterval: 4000
	}));

	const streamList = $derived(streams.data?.data ?? []);
	const jobList = $derived(
		(jobs.data?.data ?? []).filter(
			(j) =>
				(!streamFilter || j.stream_id === streamFilter) &&
				(!search.trim() ||
					`#${j.id} ${j.kind} ${j.state}`.toLowerCase().includes(search.trim().toLowerCase()))
		)
	);
	const kindLabel: Record<string, string> = { transcode: 'Transcode', restream: 'Restream' };

	function clock(s?: string) {
		return s ? new Date(s).toLocaleString() : '—';
	}
	function duration(j: { attempted_at?: string; finalized_at?: string }) {
		if (!j.attempted_at) return '—';
		const end = j.finalized_at ? new Date(j.finalized_at) : new Date();
		const ms = end.getTime() - new Date(j.attempted_at).getTime();
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
	}
</script>

<PageHeader icon={Cpu} title="Jobs" subtitle="Background transcoder and restream jobs" />

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<input class="input sm:max-w-xs" bind:value={search} placeholder="Search jobs…" />
	<label class="flex items-center gap-2 text-sm">
		<span class="text-[var(--color-muted)]">Stream</span>
		<select class="input w-auto py-1.5 text-sm" bind:value={streamFilter}>
			<option value="">All streams</option>
			{#each streamList as s (s.id)}
				<option value={s.id}>{s.name}</option>
			{/each}
		</select>
	</label>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
	{#if jobs.isPending}
		<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
	{:else if jobList.length === 0}
		<div class="p-10 text-center text-sm text-[var(--color-muted)]">No jobs yet.</div>
	{:else}
		<table class="w-full min-w-[680px] text-sm">
			<thead
				class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
			>
				<tr>
					<th class="px-4 py-2.5 font-mono">Job</th>
					<th class="px-4 py-2.5 font-mono">Kind</th>
					<th class="px-4 py-2.5 font-mono">State</th>
					<th class="px-4 py-2.5 font-mono">Attempt</th>
					<th class="px-4 py-2.5 font-mono">Duration</th>
					<th class="px-4 py-2.5 font-mono">Created</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-border)]">
				{#each jobList as j (j.id)}
					<tr
						class="cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
						onclick={() => (selected = j)}
					>
						<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">#{j.id}</td>
						<td class="px-4 py-2.5 text-[12px]">{kindLabel[j.kind] ?? j.kind}</td>
						<td class="px-4 py-2.5"><JobStateBadge state={j.state} /></td>
						<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{j.attempt}/{j.max_attempts}</td>
						<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{duration(j)}</td>
						<td class="px-4 py-2.5 text-[12px] text-[var(--color-muted)]">{clock(j.created_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	</div>
</div>

<Modal open={!!selected} title={selected ? `Job #${selected.id}` : ''} onClose={() => (selected = null)}>
	{#if selected}
		{@const j = selected}
		<dl class="space-y-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Kind</dt>
				<dd>{kindLabel[j.kind] ?? j.kind}</dd>
			</div>
			<div class="flex items-center justify-between gap-4">
				<dt class="text-[var(--color-muted)]">State</dt>
				<dd><JobStateBadge state={j.state} /></dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Attempts</dt>
				<dd class="font-mono tabular-nums">{j.attempt} / {j.max_attempts}</dd>
			</div>
			{#if j.stream_id}
				<div class="flex justify-between gap-4">
					<dt class="text-[var(--color-muted)]">Stream</dt>
					<dd>
						<a class="font-mono text-xs text-[var(--color-accent)] hover:underline" href="/streams/{j.stream_id}"
							>{j.stream_id}</a
						>
					</dd>
				</div>
			{/if}
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Created</dt>
				<dd>{clock(j.created_at)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Started</dt>
				<dd>{clock(j.attempted_at)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Finished</dt>
				<dd>{clock(j.finalized_at)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Duration</dt>
				<dd class="font-mono">{duration(j)}</dd>
			</div>
		</dl>

		{#if j.errors.length}
			<h3 class="mt-5 mb-2 text-sm font-semibold text-red-500">
				Errors ({j.errors.length})
			</h3>
			<ul class="space-y-2">
				{#each j.errors as err, i (i)}
					<li class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
						<p class="font-mono text-[11px] text-[var(--color-muted)]">{clock(err.at)}</p>
						<p class="mt-1 font-mono text-xs break-words text-red-500">{err.error}</p>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</Modal>
