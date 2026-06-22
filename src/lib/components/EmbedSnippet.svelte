<script lang="ts">
	import CopyField from './CopyField.svelte';

	let {
		id,
		kind = 'live',
		hlsUrl
	}: { id: string; kind?: 'live' | 'vod'; hlsUrl?: string } = $props();

	// Built in the browser so the snippet points at whatever origin serves the app.
	const origin = $derived(typeof location !== 'undefined' ? location.origin : '');
	const embedUrl = $derived(`${origin}/embed/${id}${kind === 'vod' ? '?kind=vod' : ''}`);
	const iframe = $derived(
		`<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
	);
</script>

<div class="space-y-3">
	<CopyField label="Embed code (iframe)" value={iframe} />
	{#if hlsUrl}
		<CopyField label="HLS URL" value={hlsUrl} />
	{/if}
	<a
		href={embedUrl}
		target="_blank"
		rel="noopener"
		class="inline-block text-xs font-medium text-[var(--color-accent)] hover:underline"
	>
		Open player in a new tab ↗
	</a>
</div>
