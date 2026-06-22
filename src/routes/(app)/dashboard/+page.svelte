<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import EmailBanner from '$lib/components/EmailBanner.svelte';
	import { LayoutDashboard, Users, HardDrive, Radio, Activity } from '@lucide/svelte';

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams(),
		refetchInterval: 5000
	}));
	const overview = createQuery(() => ({
		queryKey: keys.analytics('24h'),
		queryFn: () => api.analyticsOverview('24h'),
		refetchInterval: 15000
	}));

	const list = $derived(streams.data?.data ?? []);
	const liveCount = $derived(list.filter((s) => s.status === 'live').length);
	const sum = $derived(overview.data?.summary);
	const viewerSeries = $derived((overview.data?.series ?? []).map((p) => ({ t: p.t, v: p.viewers })));
	const firstName = $derived((auth.user?.name ?? 'there').split(' ')[0]);

	function bytes(b?: number) {
		if (!b) return '0 B';
		const u = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(b) / Math.log(1024));
		return `${(b / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
	}

	const stats = $derived([
		{ label: 'Live now', value: String(liveCount), icon: Radio, live: liveCount > 0 },
		{ label: 'Total streams', value: String(list.length), icon: Activity },
		{ label: 'Peak viewers · 24h', value: String(sum?.peak_viewers ?? 0), icon: Users },
		{ label: 'Storage used', value: bytes(sum?.storage_bytes), icon: HardDrive }
	]);
</script>

<EmailBanner />

<PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Welcome back, {firstName}" />

<!-- Stats -->
<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each stats as s (s.label)}
		{@const Icon = s.icon}
		<div class="card p-5">
			<div class="flex items-center justify-between">
				<span class="text-sm text-[var(--color-muted)]">{s.label}</span>
				<span
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
				>
					<Icon size={16} />
				</span>
			</div>
			<p class="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</p>
		</div>
	{/each}
</div>

<!-- Recent streams + viewers -->
<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
	<section class="card overflow-hidden lg:col-span-2">
		<div class="flex items-center justify-between px-6 py-4">
			<h2 class="text-base font-semibold">Recent streams</h2>
			<a class="text-sm font-medium text-[var(--color-accent)] hover:underline" href="/streams">
				View all
			</a>
		</div>
		{#if list.length === 0}
			<p class="px-6 pb-8 pt-2 text-sm text-[var(--color-muted)]">
				No streams yet. <a class="text-[var(--color-accent)] hover:underline" href="/streams"
					>Create your first one →</a
				>
			</p>
		{:else}
			<ul>
				{#each list.slice(0, 6) as s (s.id)}
					<li>
						<a
							href="/streams/{s.id}"
							class="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-[var(--color-surface-2)]"
						>
							<div class="min-w-0">
								<p class="truncate font-medium">{s.name}</p>
								<p class="text-sm text-[var(--color-muted)]">{s.ingest_protocol.toUpperCase()}</p>
							</div>
							<StatusBadge status={s.status} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card p-6">
		<h2 class="text-base font-semibold">Viewers · 24h</h2>
		<div class="mt-5">
			<Chart points={viewerSeries} color="var(--color-accent)" height={140} />
		</div>
		<div class="mt-5 grid grid-cols-2 gap-4">
			<div>
				<p class="text-sm text-[var(--color-muted)]">Avg startup</p>
				<p class="mt-0.5 text-xl font-semibold tabular-nums">{sum?.avg_startup_ms ?? 0}ms</p>
			</div>
			<div>
				<p class="text-sm text-[var(--color-muted)]">Rebuffers</p>
				<p class="mt-0.5 text-xl font-semibold tabular-nums">{sum?.total_rebuffers ?? 0}</p>
			</div>
		</div>
	</section>
</div>
