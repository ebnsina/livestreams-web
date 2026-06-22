<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ScheduleBadge from '$lib/components/ScheduleBadge.svelte';
	import Pager from '$lib/components/Pager.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Radio } from '@lucide/svelte';
	import type { LatencyMode } from '$lib/types';

	const qc = useQueryClient();

	const LIMIT = 20;
	let search = $state('');
	let offset = $state(0);
	// reset to the first page whenever the search term changes
	$effect(() => {
		void search;
		offset = 0;
	});

	const streams = createQuery(() => ({
		queryKey: [...keys.streams, search, offset],
		queryFn: () => api.listStreams({ q: search, limit: LIMIT, offset }),
		refetchInterval: 5000
	}));
	const list = $derived(streams.data?.data ?? []);
	const total = $derived(streams.data?.total ?? 0);

	let showForm = $state(false);
	let name = $state('');
	let latency = $state<LatencyMode>('low');
	let recording = $state(true);
	let schedule = $state(''); // datetime-local value

	const create = createMutation(() => ({
		mutationFn: () =>
			api.createStream({
				name,
				latency_mode: latency,
				recording_enabled: recording,
				scheduled_at: schedule ? new Date(schedule).toISOString() : null
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.streams });
			showForm = false;
			name = '';
			schedule = '';
		}
	}));
</script>

<PageHeader icon={Radio} title="Streams" subtitle="Create and manage your channels">
	{#snippet actions()}
		{#if auth.canWrite}
			<button class="btn-primary" onclick={() => (showForm = !showForm)}>
				{showForm ? 'Cancel' : '+ New stream'}
			</button>
		{/if}
	{/snippet}
</PageHeader>

{#if showForm}
	<form
		class="card mb-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_auto]"
		onsubmit={(e) => {
			e.preventDefault();
			create.mutate();
		}}
	>
		<div>
			<label class="label" for="name">Name</label>
			<input id="name" class="input" bind:value={name} placeholder="Main channel" required />
		</div>
		<div>
			<label class="label" for="latency">Latency</label>
			<select id="latency" class="input" bind:value={latency}>
				<option value="standard">Standard</option>
				<option value="low">Low</option>
				<option value="ultra_low">Ultra low</option>
			</select>
		</div>
		<div>
			<label class="label" for="schedule">Schedule (optional)</label>
			<input id="schedule" class="input" type="datetime-local" bind:value={schedule} />
		</div>
		<label class="flex items-end gap-2 pb-2 text-sm">
			<input type="checkbox" bind:checked={recording} class="rounded" />
			Record
		</label>
		<div class="flex items-end">
			<button class="btn-primary" type="submit" disabled={create.isPending}>
				{create.isPending ? 'Creating…' : 'Create'}
			</button>
		</div>
	</form>
{/if}

<div class="mb-5">
	<input class="input sm:max-w-xs" bind:value={search} placeholder="Search streams…" />
</div>

<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
	{#if streams.isPending}
		<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
	{:else if list.length === 0}
		<div class="p-10 text-center text-sm text-[var(--color-muted)]">
			{search ? 'No streams match your search.' : 'No streams yet. Create one to get started.'}
		</div>
	{:else}
		{#each list as s (s.id)}
			<a
				href="/streams/{s.id}"
				class="flex items-center justify-between p-4 transition-colors hover:bg-[var(--color-surface-2)]"
			>
				<div>
					<p class="font-medium">{s.name}</p>
					<p class="text-xs text-[var(--color-muted)]">
						{s.ingest_protocol.toUpperCase()} · {s.latency_mode.replace('_', ' ')}
					</p>
				</div>
				<div class="flex items-center gap-2">
					{#if s.status !== 'live'}<ScheduleBadge at={s.scheduled_at} />{/if}
					<StatusBadge status={s.status} />
				</div>
			</a>
		{/each}
	{/if}
</div>

<Pager {total} limit={LIMIT} {offset} onChange={(o) => (offset = o)} />
