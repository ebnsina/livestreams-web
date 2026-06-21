<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Recordings from '$lib/components/Recordings.svelte';

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams(),
		refetchInterval: 5000
	}));

	const recordings = createQuery(() => ({
		queryKey: keys.assets,
		queryFn: () => api.assets()
	}));

	const list = $derived(streams.data?.data ?? []);
	const liveCount = $derived(list.filter((s) => s.status === 'live').length);
	const recent = $derived(recordings.data?.data ?? []);
</script>

<header class="mb-8">
	<h1 class="text-2xl font-semibold">Dashboard</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">Overview of your streaming activity</p>
</header>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
	<div class="card p-5">
		<p class="text-sm text-[var(--color-muted)]">Total streams</p>
		<p class="mt-2 text-3xl font-semibold">{list.length}</p>
	</div>
	<div class="card p-5">
		<p class="text-sm text-[var(--color-muted)]">Live now</p>
		<p class="mt-2 flex items-center gap-3 text-3xl font-semibold">
			{liveCount}
			{#if liveCount > 0}<span class="relative flex h-2.5 w-2.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
					></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
				</span>{/if}
		</p>
	</div>
	<div class="card p-5">
		<p class="text-sm text-[var(--color-muted)]">Idle</p>
		<p class="mt-2 text-3xl font-semibold">{list.length - liveCount}</p>
	</div>
</div>

<section class="mt-8">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-medium">Recent streams</h2>
		<a class="text-sm font-medium text-teal-400 hover:text-teal-300" href="/streams">View all</a
		>
	</div>

	<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
		{#if streams.isPending}
			<div class="p-6 text-sm text-[var(--color-muted)]">Loading…</div>
		{:else if list.length === 0}
			<div class="p-6 text-sm text-[var(--color-muted)]">
				No streams yet. <a class="text-teal-400" href="/streams">Create your first one →</a>
			</div>
		{:else}
			{#each list.slice(0, 5) as s (s.id)}
				<a
					href="/streams/{s.id}"
					class="flex items-center justify-between p-4 transition-colors hover:bg-[var(--color-surface-2)]"
				>
					<div>
						<p class="font-medium">{s.name}</p>
						<p class="text-xs text-[var(--color-muted)]">{s.ingest_protocol.toUpperCase()}</p>
					</div>
					<StatusBadge status={s.status} />
				</a>
			{/each}
		{/if}
	</div>
</section>

{#if recent.length > 0}
	<section class="mt-8">
		<h2 class="mb-3 text-lg font-medium">Recent recordings</h2>
		<Recordings assets={recent.slice(0, 5)} />
	</section>
{/if}
