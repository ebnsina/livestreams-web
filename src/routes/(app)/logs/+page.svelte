<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import type { StreamEvent } from '$lib/types';
	import Timeline from '$lib/components/Timeline.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { ScrollText } from '@lucide/svelte';

	let level = $state<'all' | 'error'>('all');
	let streamFilter = $state('');
	let search = $state('');
	let selected = $state<StreamEvent | null>(null);

	const streams = createQuery(() => ({ queryKey: keys.streams, queryFn: () => api.listStreams() }));
	const all = createQuery(() => ({
		queryKey: keys.activity('all'),
		queryFn: () => api.activity(),
		refetchInterval: 6000
	}));
	const errs = createQuery(() => ({
		queryKey: keys.activity('error'),
		queryFn: () => api.activity('error'),
		refetchInterval: 6000
	}));

	const streamList = $derived(streams.data?.data ?? []);
	const source = $derived(level === 'error' ? (errs.data?.data ?? []) : (all.data?.data ?? []));
	const list = $derived(
		source.filter(
			(e) =>
				(!streamFilter || e.stream_id === streamFilter) &&
				(!search.trim() ||
					`${e.type} ${e.message}`.toLowerCase().includes(search.trim().toLowerCase()))
		)
	);

	const pill: Record<string, string> = {
		info: 'bg-sky-500/12 text-sky-500',
		warn: 'bg-amber-500/12 text-amber-500',
		error: 'bg-red-500/12 text-red-500'
	};
	function pretty(data: unknown) {
		return data ? JSON.stringify(data, null, 2) : '';
	}
	const tabs: { id: 'all' | 'error'; label: string }[] = [
		{ id: 'all', label: 'Activity' },
		{ id: 'error', label: 'Errors' }
	];
</script>

<PageHeader icon={ScrollText} title="Logs" subtitle="Account-wide event activity — click an entry for details" />

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
		{#each tabs as t (t.id)}
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {level === t.id
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
				onclick={() => (level = t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<input class="input w-auto py-1.5 text-sm" bind:value={search} placeholder="Search events…" />
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
</div>

<Timeline events={list} onSelect={(e) => (selected = e)} />

<Modal open={!!selected} title="Event" onClose={() => (selected = null)}>
	{#if selected}
		{@const e = selected}
		<div class="mb-4 flex items-center gap-2">
			<span class="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium {pill[e.level] ?? ''}"
				>{e.type}</span
			>
			<span class="text-xs text-[var(--color-muted)]">{e.level}</span>
		</div>
		<p class="text-base font-medium {e.level === 'error' ? 'text-red-500' : ''}">{e.message}</p>

		<dl class="mt-4 space-y-2 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Time</dt>
				<dd>{new Date(e.created_at).toLocaleString()}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-[var(--color-muted)]">Stream</dt>
				<dd>
					<a class="font-mono text-xs text-[var(--color-accent)] hover:underline" href="/streams/{e.stream_id}"
						>{e.stream_id}</a
					>
				</dd>
			</div>
			{#if e.session_id}
				<div class="flex justify-between gap-4">
					<dt class="text-[var(--color-muted)]">Session</dt>
					<dd class="font-mono text-xs">{e.session_id}</dd>
				</div>
			{/if}
		</dl>

		{#if e.data && Object.keys(e.data).length}
			<h3 class="mt-5 mb-2 text-sm font-semibold">Data</h3>
			<pre
				class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-mono text-[11px]">{pretty(
					e.data
				)}</pre>
		{/if}
	{/if}
</Modal>
