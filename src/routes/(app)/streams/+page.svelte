<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { LatencyMode } from '$lib/types';

	const qc = useQueryClient();

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams(),
		refetchInterval: 5000
	}));
	const list = $derived(streams.data?.data ?? []);

	let showForm = $state(false);
	let name = $state('');
	let latency = $state<LatencyMode>('low');
	let recording = $state(true);

	const create = createMutation(() => ({
		mutationFn: () =>
			api.createStream({ name, latency_mode: latency, recording_enabled: recording }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.streams });
			showForm = false;
			name = '';
		}
	}));
</script>

<header class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-semibold">Streams</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">Create and manage your channels</p>
	</div>
	{#if auth.canWrite}
		<button class="btn-primary" onclick={() => (showForm = !showForm)}>
			{showForm ? 'Cancel' : '+ New stream'}
		</button>
	{/if}
</header>

{#if showForm}
	<form
		class="card mb-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_auto_auto_auto]"
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

<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
	{#if streams.isPending}
		<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
	{:else if list.length === 0}
		<div class="p-10 text-center text-sm text-[var(--color-muted)]">
			No streams yet. Create one to get started.
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
				<StatusBadge status={s.status} />
			</a>
		{/each}
	{/if}
</div>
