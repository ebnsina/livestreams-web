<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import Player from '$lib/components/Player.svelte';

	const BASE = PUBLIC_API_BASE_URL ?? 'http://localhost:8085';
	const id = $derived(page.params.id as string);
	// kind=live (default) plays the live HLS; kind=vod plays an on-demand asset.
	const kind = $derived(page.url.searchParams.get('kind') === 'vod' ? 'vod' : 'live');
	const isLive = $derived(kind === 'live');
	const src = $derived(`${BASE.replace(/\/$/, '')}/${kind}/${id}/index.m3u8`);
</script>

<svelte:head>
	<title>Player</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- Full-bleed black player sized to the host iframe -->
<div class="embed-root">
	{#key src}
		<Player {src} live={isLive} streamId={isLive ? id : ''} />
	{/key}
</div>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		height: 100%;
		background: #000;
	}
	.embed-root {
		position: fixed;
		inset: 0;
		background: #000;
	}
	/* fill the iframe: strip the Player's card chrome and let the video cover */
	.embed-root :global(> div:first-child) {
		height: 100%;
		border: 0;
		border-radius: 0;
	}
	/* hide the Player's external quality strip — keep only the in-video menu */
	.embed-root :global(> div:nth-child(2)) {
		display: none;
	}
	.embed-root :global(video) {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}
</style>
