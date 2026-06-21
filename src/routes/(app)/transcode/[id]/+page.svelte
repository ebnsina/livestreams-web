<script lang="ts">
	import { page } from '$app/state';
	import TranscodeTimeline from '$lib/components/TranscodeTimeline.svelte';
	import { ArrowLeft, Terminal } from '@lucide/svelte';

	const id = $derived(page.params.id as string);
	const title = $derived(page.url.searchParams.get('title') || '');
</script>

<svelte:head><title>Transcode console · Livestreams</title></svelte:head>

<header class="mb-5">
	<a
		href="/transcodes"
		class="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
	>
		<ArrowLeft size={14} /> Transcodes
	</a>
	<h1 class="flex items-center gap-2 text-2xl font-semibold">
		<Terminal size={22} /> Transcode console
	</h1>
	<p class="mt-1 truncate font-mono text-xs text-[var(--color-muted)]">
		{title ? `${title} · ` : ''}{id}
	</p>
</header>

{#key id}
	<TranscodeTimeline assetId={id} height="64vh" />
{/key}
