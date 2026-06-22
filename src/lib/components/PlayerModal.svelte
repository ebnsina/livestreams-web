<script lang="ts">
	import { api } from '$lib/api';
	import type { Asset } from '$lib/types';
	import Modal from './Modal.svelte';
	import Player from './Player.svelte';

	let { asset, onClose }: { asset: Asset | null; onClose: () => void } = $props();

	let url = $state<string | null>(null);
	let error = $state(false);

	$effect(() => {
		const a = asset;
		url = null;
		error = false;
		if (!a) return;
		api
			.assetPlayback(a.id)
			.then((r) => a === asset && (url = r.url))
			.catch(() => (error = true));
	});
</script>

<Modal open={!!asset} title={asset ? asset.title : ''} onClose={onClose}>
	{#if asset}
		{#if url}
			{#key url}
				<Player
					src={url}
					poster={asset.thumbnail ? api.thumbnailUrl(asset.id) : ''}
					storyboard={asset.storyboard ? api.storyboardUrl(asset.id) : ''}
					captions={asset.caption_status === 'ready' ? api.captionsUrl(asset.id) : ''}
				/>
			{/key}
		{:else if error}
			<p class="py-6 text-center text-sm text-red-500">Could not load the video.</p>
		{:else}
			<div class="aspect-video w-full animate-pulse rounded-xl bg-[var(--color-surface-2)]"></div>
		{/if}
	{/if}
</Modal>
