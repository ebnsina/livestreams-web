<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ScheduleBadge from '$lib/components/ScheduleBadge.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import Donut from '$lib/components/Donut.svelte';
	import {
		Radio,
		UploadCloud,
		Film,
		BarChart3,
		Plus,
		Users,
		HardDrive,
		CalendarClock,
		ArrowUpRight
	} from '@lucide/svelte';

	const streams = createQuery(() => ({
		queryKey: keys.streams,
		queryFn: () => api.listStreams(),
		refetchInterval: 5000
	}));
	const assets = createQuery(() => ({
		queryKey: keys.assets,
		queryFn: () => api.assets({ limit: 6 })
	}));
	const overview = createQuery(() => ({
		queryKey: keys.analytics('24h'),
		queryFn: () => api.analyticsOverview('24h'),
		refetchInterval: 15000
	}));

	const list = $derived(streams.data?.data ?? []);
	const liveCount = $derived(list.filter((s) => s.status === 'live').length);
	const recent = $derived(assets.data?.data ?? []);
	const sum = $derived(overview.data?.summary);
	const viewerSeries = $derived((overview.data?.series ?? []).map((p) => ({ t: p.t, v: p.viewers })));

	const upcoming = $derived(
		list
			.filter((s) => s.scheduled_at && new Date(s.scheduled_at).getTime() > Date.now())
			.sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
			.slice(0, 4)
	);

	const firstName = $derived((auth.user?.name ?? 'there').split(' ')[0]);

	// donut ratios (channel mix)
	const total = $derived(Math.max(1, list.length));
	const recOn = $derived(list.filter((s) => s.recording_enabled).length);
	const scheduledCount = $derived(upcoming.length);

	// 7-day calendar strip (today + next 6), with dots on days that have a scheduled stream
	const days = $derived(
		Array.from({ length: 7 }, (_, i) => {
			const d = new Date();
			d.setHours(0, 0, 0, 0);
			d.setDate(d.getDate() + i);
			return d;
		})
	);
	const scheduledDays = $derived(
		new Set(
			list
				.filter((s) => s.scheduled_at)
				.map((s) => new Date(s.scheduled_at!).toDateString())
		)
	);
	const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const actions = [
		{ href: '/streams', label: 'New stream', sub: 'Create a channel', icon: Radio },
		{ href: '/transcodes', label: 'Upload video', sub: 'Transcode to HLS', icon: UploadCloud },
		{ href: '/recordings', label: 'Recordings', sub: 'Past sessions', icon: Film },
		{ href: '/analytics', label: 'Analytics', sub: 'Audience & QoS', icon: BarChart3 }
	];

	function bytes(b?: number) {
		if (!b) return '0 B';
		const u = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(b) / Math.log(1024));
		return `${(b / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
	}
	function when(s: string) {
		return new Date(s).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	const typeLabel: Record<string, string> = {
		live_recording: 'Recording',
		vod: 'VOD',
		clip: 'Clip',
		upload: 'Upload'
	};
</script>

<!-- Hero -->
<section class="mb-6">
	<p class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
		Hi, {firstName}! 👋
	</p>
	<p class="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
		Here's what's happening across your streams, recordings, and audience today.
	</p>
</section>

<!-- Quick actions -->
<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each actions as a (a.href)}
		{@const Icon = a.icon}
		<a
			href={a.href}
			class="card group flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
		>
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff5b3e]/12 text-[#ff5b3e]"
			>
				<Icon size={20} />
			</span>
			<div class="min-w-0">
				<p class="flex items-center gap-1 font-medium">
					{a.label}
					<ArrowUpRight
						size={14}
						class="text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</p>
				<p class="truncate text-xs text-[var(--color-muted)]">{a.sub}</p>
			</div>
		</a>
	{/each}
</div>

<!-- Stat cards -->
<div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<div class="card p-5">
		<div class="flex items-center justify-between">
			<p class="text-xs text-[var(--color-muted)]">Live now</p>
			{#if liveCount > 0}
				<span class="relative flex h-2 w-2"
					><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
					></span><span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span></span
				>
			{/if}
		</div>
		<p class="mt-2 text-3xl font-semibold tabular-nums">{liveCount}</p>
	</div>
	<div class="card p-5">
		<p class="text-xs text-[var(--color-muted)]">Total streams</p>
		<p class="mt-2 text-3xl font-semibold tabular-nums">{list.length}</p>
	</div>
	<div class="card p-5">
		<p class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]"><Users size={13} /> Peak viewers (24h)</p>
		<p class="mt-2 text-3xl font-semibold tabular-nums">{sum?.peak_viewers ?? 0}</p>
	</div>
	<div class="card p-5">
		<p class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]"><HardDrive size={13} /> Storage</p>
		<p class="mt-2 text-3xl font-semibold tabular-nums">{bytes(sum?.storage_bytes)}</p>
	</div>
</div>

<!-- Panels -->
<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
	<!-- Recent streams -->
	<section class="card overflow-hidden">
		<div class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
			<span class="text-[13px] font-semibold">Recent streams</span>
			<a class="text-xs font-medium text-[#ff5b3e] hover:underline" href="/streams">View all</a>
		</div>
		{#if list.length === 0}
			<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
				No streams yet. <a class="text-[#ff5b3e]" href="/streams">Create one →</a>
			</div>
		{:else}
			<ul class="divide-y divide-[var(--color-border)]">
				{#each list.slice(0, 5) as s (s.id)}
					<li>
						<a
							href="/streams/{s.id}"
							class="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--color-surface-2)]"
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{s.name}</p>
								<p class="text-xs text-[var(--color-muted)]">{s.ingest_protocol.toUpperCase()}</p>
							</div>
							<StatusBadge status={s.status} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Upcoming / scheduled -->
	<section class="card overflow-hidden">
		<div class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
			<span class="flex items-center gap-1.5 text-[13px] font-semibold"
				><CalendarClock size={15} /> Upcoming</span
			>
		</div>
		<!-- 7-day strip -->
		<div class="grid grid-cols-7 gap-1 border-b border-[var(--color-border)] px-3 py-3 text-center">
			{#each days as d, i (i)}
				{@const has = scheduledDays.has(d.toDateString())}
				<div
					class="rounded-lg py-1.5 {i === 0 ? 'bg-[#ff5b3e] text-white' : 'text-[var(--color-text)]'}"
				>
					<p class="text-[9px] uppercase {i === 0 ? 'text-white/80' : 'text-[var(--color-muted)]'}">
						{dow[d.getDay()]}
					</p>
					<p class="text-sm font-semibold tabular-nums">{d.getDate()}</p>
					<span
						class="mx-auto mt-0.5 block h-1 w-1 rounded-full {has
							? i === 0
								? 'bg-white'
								: 'bg-[#ff5b3e]'
							: 'bg-transparent'}"
					></span>
				</div>
			{/each}
		</div>
		{#if upcoming.length === 0}
			<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
				No scheduled streams.
			</div>
		{:else}
			<ul class="divide-y divide-[var(--color-border)]">
				{#each upcoming as s (s.id)}
					<li class="flex items-center justify-between gap-2 px-5 py-3">
						<div class="min-w-0">
							<a href="/streams/{s.id}" class="truncate text-sm font-medium hover:underline">{s.name}</a>
							<p class="font-mono text-[11px] text-[var(--color-muted)]">{when(s.scheduled_at!)}</p>
						</div>
						<ScheduleBadge at={s.scheduled_at} />
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Channel mix donuts -->
	<section class="card p-5">
		<span class="text-[13px] font-semibold">Channel mix</span>
		<div class="mt-4 grid grid-cols-3 gap-2">
			<Donut value={(liveCount / total) * 100} color="#ef4444" label="Live" sub="{liveCount}/{list.length}" />
			<Donut value={(recOn / total) * 100} color="#ff5b3e" label="Recording" sub="{recOn}/{list.length}" />
			<Donut value={(scheduledCount / total) * 100} color="#0ea5e9" label="Scheduled" sub="{scheduledCount}/{list.length}" />
		</div>
	</section>
</div>

<!-- Viewers chart + promo -->
<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
	<section class="card p-5 lg:col-span-2">
		<div class="mb-3 flex items-center justify-between">
			<span class="text-[13px] font-semibold">Viewers · 24h</span>
			<a class="text-xs font-medium text-[#ff5b3e] hover:underline" href="/analytics">Details</a>
		</div>
		<Chart points={viewerSeries} color="#ff5b3e" height={150} />
		<div class="mt-3 grid grid-cols-3 gap-2 text-center">
			<div>
				<p class="text-lg font-semibold tabular-nums">{sum?.avg_startup_ms ?? 0}ms</p>
				<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Startup</p>
			</div>
			<div>
				<p class="text-lg font-semibold tabular-nums">{sum?.total_rebuffers ?? 0}</p>
				<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Rebuffers</p>
			</div>
			<div>
				<p class="text-lg font-semibold tabular-nums">{(sum?.recordings ?? 0) + (sum?.vod ?? 0)}</p>
				<p class="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Assets</p>
			</div>
		</div>
	</section>

	<!-- Promo / CTA -->
	<section
		class="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-br from-[#ff5b3e] to-[#ff7a63] p-6 text-white"
	>
		<div>
			<span class="inline-flex rounded-lg bg-white/20 p-2"><Radio size={20} /></span>
			<h3 class="font-display mt-3 text-xl font-semibold">Go live in minutes</h3>
			<p class="mt-1 text-sm text-white/85">
				Point OBS or any RTMP/SRT encoder at your stream's ingest URL — adaptive HLS, recording, and
				multistream kick in automatically.
			</p>
		</div>
		<a
			href="/streams"
			class="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#ff5b3e] transition-opacity hover:opacity-90"
		>
			<Plus size={16} /> New stream
		</a>
	</section>
</div>

<!-- Recent media (full width) -->
<section class="card mt-4 overflow-hidden">
	<div class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
		<span class="text-[13px] font-semibold">Recent media</span>
		<a class="text-xs font-medium text-[#ff5b3e] hover:underline" href="/recordings">View all</a>
	</div>
	{#if recent.length === 0}
		<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
			Nothing yet — recordings and uploads appear here.
		</div>
	{:else}
		<ul class="divide-y divide-[var(--color-border)]">
			{#each recent.slice(0, 6) as a (a.id)}
				<li class="flex items-center gap-3 px-5 py-3">
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
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{a.title}</p>
						<p class="text-xs text-[var(--color-muted)]">
							{typeLabel[a.type] ?? a.type} · {when(a.created_at)}
						</p>
					</div>
					<span
						class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium {a.status === 'ready'
							? 'bg-emerald-500/12 text-emerald-600'
							: a.status === 'errored'
								? 'bg-red-500/12 text-red-600'
								: 'bg-[#ff5b3e]/12 text-[#ff5b3e]'}">{a.status}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</section>
