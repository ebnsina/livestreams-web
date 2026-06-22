<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ScheduleBadge from '$lib/components/ScheduleBadge.svelte';
	import Pager from '$lib/components/Pager.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { createStreamSchema, fieldErrors } from '$lib/schemas';
	import { Radio, Plus, MonitorPlay, Video } from '@lucide/svelte';
	import { toast } from '$lib/toast.svelte';
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
	let nameError = $state('');
	let source = $state<'rtmp' | 'webcam'>('rtmp'); // how they'll go live
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
		onSuccess: (stream) => {
			qc.invalidateQueries({ queryKey: keys.streams });
			showForm = false;
			name = '';
			schedule = '';
			toast.success('Stream created');
			// route by intent: webcam → Studio, OBS/RTMP → detail (ingest creds)
			goto(source === 'webcam' ? `/streams/${stream.id}/studio` : `/streams/${stream.id}`);
		},
		onError: () => toast.error("Couldn't create stream — try again")
	}));
</script>

<PageHeader icon={Radio} title="Streams" subtitle="Create and manage your channels">
	{#snippet actions()}
		{#if auth.canWrite}
			<button class="btn-primary" onclick={() => (showForm = true)}>
				<Plus size={16} /> New stream
			</button>
		{/if}
	{/snippet}
</PageHeader>

<Dialog bind:open={showForm} title="New stream" subtitle="Create a channel to start streaming">
	<form
		class="space-y-4"
		novalidate
		onsubmit={(e) => {
			e.preventDefault();
			const r = createStreamSchema.safeParse({ name });
			if (!r.success) {
				nameError = fieldErrors(r.error).name ?? '';
				return;
			}
			nameError = '';
			create.mutate();
		}}
	>
		<div>
			<label class="label" for="name">Name</label>
			<input id="name" class="input" bind:value={name} placeholder="Main channel" />
			{#if nameError}<p class="mt-1 text-xs text-red-500">{nameError}</p>{/if}
		</div>
		<div>
			<span class="label">How will you go live?</span>
			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					class="squircle flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors {source ===
					'rtmp'
						? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
						: 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}"
					onclick={() => (source = 'rtmp')}
				>
					<MonitorPlay size={18} class="text-[var(--color-accent)]" />
					<span class="text-sm font-medium">Encoder / OBS</span>
					<span class="text-xs text-[var(--color-muted)]">RTMP or SRT ingest</span>
				</button>
				<button
					type="button"
					class="squircle flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors {source ===
					'webcam'
						? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
						: 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}"
					onclick={() => (source = 'webcam')}
				>
					<Video size={18} class="text-[var(--color-accent)]" />
					<span class="text-sm font-medium">Webcam / Screen</span>
					<span class="text-xs text-[var(--color-muted)]">Go live in the browser</span>
				</button>
			</div>
		</div>
		<div>
			<label class="label" for="latency">Latency mode</label>
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
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={recording} class="rounded" />
			Record this stream
		</label>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={create.isPending}>
				{create.isPending ? 'Creating…' : 'Create stream'}
			</button>
		</div>
	</form>
</Dialog>

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
