<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import JobStateBadge from '$lib/components/JobStateBadge.svelte';
	import Timeline from '$lib/components/Timeline.svelte';

	type Tab = 'jobs' | 'errors' | 'activity';
	let tab = $state<Tab>('jobs');
	let streamFilter = $state(''); // '' = all streams

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams()
	}));

	const jobs = createQuery(() => ({
		queryKey: keys.jobs,
		queryFn: () => api.jobs(),
		refetchInterval: 4000
	}));

	const activity = createQuery(() => ({
		queryKey: keys.activity('all'),
		queryFn: () => api.activity(),
		refetchInterval: 6000
	}));

	const errors = createQuery(() => ({
		queryKey: keys.activity('error'),
		queryFn: () => api.activity('error'),
		refetchInterval: 6000
	}));

	const streamList = $derived(streams.data?.data ?? []);
	const jobList = $derived(
		(jobs.data?.data ?? []).filter((j) => !streamFilter || j.stream_id === streamFilter)
	);
	const activityList = $derived(
		(activity.data?.data ?? []).filter((e) => !streamFilter || e.stream_id === streamFilter)
	);
	const errorList = $derived(
		(errors.data?.data ?? []).filter((e) => !streamFilter || e.stream_id === streamFilter)
	);

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

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'jobs', label: 'Transcoder jobs' },
		{ id: 'errors', label: 'Error log' },
		{ id: 'activity', label: 'Activity' }
	];
</script>

<header class="mb-6">
	<h1 class="text-2xl font-semibold">Jobs &amp; Logs</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">
		Background transcoder jobs, errors, and activity across your account
	</p>
</header>

<!-- controls: tabs + stream picker -->
<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div class="inline-flex gap-px rounded-lg bg-[var(--color-border)] p-0.5">
		{#each tabs as t (t.id)}
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {tab === t.id
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
				onclick={() => (tab = t.id)}
			>
				{t.label}
				{#if t.id === 'jobs' && jobList.length}
					<span class="ml-1 font-mono text-[11px] text-[var(--color-muted)]">{jobList.length}</span>
				{/if}
			</button>
		{/each}
	</div>

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

{#if tab === 'jobs'}
	<div class="card overflow-x-auto">
		{#if jobs.isPending}
			<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
		{:else if jobList.length === 0}
			<div class="p-10 text-center text-sm text-[var(--color-muted)]">
				No transcoder jobs yet. Go live on a stream to create one.
			</div>
		{:else}
			<table class="w-full min-w-[720px] text-sm">
				<thead
					class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
				>
					<tr>
						<th class="px-4 py-2.5 font-mono">Job</th>
						<th class="px-4 py-2.5 font-mono">State</th>
						<th class="px-4 py-2.5 font-mono">Stream</th>
						<th class="px-4 py-2.5 font-mono">Attempt</th>
						<th class="px-4 py-2.5 font-mono">Duration</th>
						<th class="px-4 py-2.5 font-mono">Created</th>
						<th class="px-4 py-2.5 font-mono">Last error</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border)]">
					{#each jobList as j (j.id)}
						<tr class="transition-colors hover:bg-[var(--color-surface-2)]">
							<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">#{j.id}</td>
							<td class="px-4 py-2.5"><JobStateBadge state={j.state} /></td>
							<td class="px-4 py-2.5">
								{#if j.stream_id}
									<a class="font-mono text-[11px] text-teal-400 hover:text-teal-300" href="/streams/{j.stream_id}"
										>{j.stream_id.slice(0, 8)}</a
									>
								{:else}—{/if}
							</td>
							<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{j.attempt}/{j.max_attempts}</td>
							<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{duration(j)}</td>
							<td class="px-4 py-2.5 text-[12px] text-[var(--color-muted)]">{clock(j.created_at)}</td>
							<td class="max-w-[260px] px-4 py-2.5">
								{#if j.errors.length}
									<span class="block truncate font-mono text-[11px] text-red-500" title={j.errors.at(-1)?.error}
										>{j.errors.at(-1)?.error}</span
									>
								{:else}<span class="text-[var(--color-muted)]">—</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{:else if tab === 'errors'}
	<Timeline events={errorList} />
{:else}
	<Timeline events={activityList} />
{/if}
