<script lang="ts">
	import Hls from 'hls.js';
	import { api } from '$lib/api';
	import type { Asset } from '$lib/types';
	import { toast } from '$lib/toast.svelte';
	import Modal from './Modal.svelte';

	let {
		asset,
		onClose,
		onDone
	}: { asset: Asset | null; onClose: () => void; onDone: () => void } = $props();

	let video = $state<HTMLVideoElement>();
	let hls: Hls | null = null;
	let current = $state(0);
	let dur = $state(0);
	let start = $state(0);
	let end = $state(0);
	let title = $state('');
	let loadError = $state<string | null>(null);
	let submitError = $state<string | null>(null);
	let saving = $state(false);

	// Load the source whenever the modal opens with an asset.
	$effect(() => {
		const a = asset;
		teardown();
		current = 0;
		dur = 0;
		start = 0;
		end = 0;
		title = '';
		loadError = null;
		submitError = null;
		if (!a) return;
		void load(a);
	});

	async function load(a: Asset) {
		try {
			const res = await api.assetPlayback(a.id);
			// wait a tick for the <video> to mount
			await Promise.resolve();
			if (!video) return;
			if (res.kind === 'hls' && Hls.isSupported()) {
				hls = new Hls();
				hls.loadSource(res.url);
				hls.attachMedia(video);
			} else {
				video.src = res.url;
			}
		} catch {
			loadError = 'Could not load source video';
		}
	}

	function teardown() {
		if (hls) {
			hls.destroy();
			hls = null;
		}
	}

	function fmt(s: number) {
		if (!isFinite(s)) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const clipLen = $derived(Math.max(0, end - start));

	async function save() {
		if (!asset || end <= start) return;
		saving = true;
		submitError = null;
		try {
			await api.createClip(asset.id, {
				title: title.trim(),
				start_sec: Number(start.toFixed(2)),
				end_sec: Number(end.toFixed(2))
			});
			teardown();
			toast.success('Clip queued');
			onDone();
			onClose();
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Could not create clip';
			toast.error("Couldn't create clip — try again");
		} finally {
			saving = false;
		}
	}

	function close() {
		teardown();
		onClose();
	}
</script>

<Modal open={!!asset} title="Create clip" onClose={close}>
	{#if loadError}
		<p class="text-sm text-red-500">{loadError}</p>
	{:else}
		<div class="space-y-4">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				bind:this={video}
				controls
				class="aspect-video w-full rounded-lg bg-black"
				ontimeupdate={() => (current = video?.currentTime ?? 0)}
				onloadedmetadata={() => {
					dur = video?.duration ?? 0;
					end = dur;
				}}
			></video>

			<!-- in/out controls -->
			<div class="flex items-center gap-2">
				<button class="btn-ghost text-sm" onclick={() => (start = current)}>
					Set start ⟶ <span class="font-mono">{fmt(current)}</span>
				</button>
				<button class="btn-ghost text-sm" onclick={() => (end = current)}>
					Set end ⟶ <span class="font-mono">{fmt(current)}</span>
				</button>
				<span class="ml-auto text-xs text-[var(--color-muted)]">
					Clip: <span class="font-mono">{fmt(start)} – {fmt(end)}</span>
					(<span class="font-mono tabular-nums">{clipLen.toFixed(1)}s</span>)
				</span>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="label" for="clip-start">Start (sec)</label>
					<input
						id="clip-start"
						class="input"
						type="number"
						min="0"
						max={dur || undefined}
						step="0.1"
						bind:value={start}
					/>
				</div>
				<div>
					<label class="label" for="clip-end">End (sec)</label>
					<input
						id="clip-end"
						class="input"
						type="number"
						min="0"
						max={dur || undefined}
						step="0.1"
						bind:value={end}
					/>
				</div>
			</div>

			<div>
				<label class="label" for="clip-title">Title</label>
				<input id="clip-title" class="input" bind:value={title} placeholder="Highlight" />
			</div>

			{#if submitError}
				<p class="text-sm text-red-500">{submitError}</p>
			{/if}

			<div class="flex justify-end gap-2">
				<button class="btn-ghost" onclick={close}>Cancel</button>
				<button class="btn-primary" onclick={save} disabled={saving || end <= start}>
					{saving ? 'Creating…' : 'Create clip'}
				</button>
			</div>
		</div>
	{/if}
</Modal>
