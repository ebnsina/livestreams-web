<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import BrowserGoLive from '$lib/components/BrowserGoLive.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import ErrorState from '$lib/components/ErrorState.svelte';
	import { ArrowLeft, Radio } from '@lucide/svelte';

	const id = $derived(page.params.id ?? '');
	const stream = createQuery(() => ({
		queryKey: keys.stream(id),
		queryFn: () => api.getStream(id),
		refetchInterval: 5000
	}));
	const s = $derived(stream.data);
	const isLive = $derived(s?.status === 'live');
</script>

<svelte:head><title>Studio · Livestreams</title></svelte:head>

<div class="mb-5 flex items-center justify-between gap-3">
	<div class="min-w-0">
		<a
			href="/streams/{id}"
			class="mb-1 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
		>
			<ArrowLeft size={15} /> Back to stream
		</a>
		<h1 class="flex items-center gap-2 truncate text-2xl font-semibold tracking-tight">
			<Radio size={20} class="text-[var(--color-accent)]" />
			{s?.name ?? 'Studio'}
		</h1>
	</div>
	{#if isLive}
		<span class="flex items-center gap-1.5 text-sm font-medium text-red-500">
			<span class="relative flex h-2 w-2">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
			</span>
			LIVE
		</span>
	{/if}
</div>

{#if stream.isError}
	<ErrorState error={stream.error} title="Stream not found" onRetry={() => stream.refetch()} />
{:else if !s}
	<div class="card aspect-video animate-pulse"></div>
{:else if !auth.canWrite}
	<div class="card p-8 text-center text-sm text-[var(--color-muted)]">
		You don't have permission to broadcast to this stream.
	</div>
{:else if !s.ingest?.whip_url}
	<div class="card p-8 text-center text-sm text-[var(--color-muted)]">
		Browser broadcasting isn't available for this stream.
	</div>
{:else}
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
		<div class="space-y-4">
			<BrowserGoLive whipUrl={api.whipUrl(id)} />
			<p class="px-1 text-xs text-[var(--color-muted)]">
				Browser go-live uses WebRTC (UDP). It needs the media server reachable directly — it
				works in production and on Linux hosts. If you're running locally via Docker Desktop
				(macOS/Windows), use an encoder (OBS) with the RTMP details on the
				<a href="/streams/{id}" class="text-[var(--color-accent)] hover:underline">stream page</a>
				instead.
			</p>
			<div class="card space-y-3 p-5">
				<h2 class="text-sm font-semibold text-[var(--color-muted)]">How viewers watch</h2>
				<CopyField label="Playback URL (HLS)" value={s.playback_url} />
				<a href="/streams/{id}" class="text-sm font-medium text-[var(--color-accent)] hover:underline">
					Manage stream, recordings & multistream →
				</a>
			</div>
		</div>
		<ChatPanel />
	</div>
{/if}
