<script lang="ts">
	import { api } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import Modal from './Modal.svelte';
	import { UploadCloud } from '@lucide/svelte';

	let { open = false, onClose, onDone }: { open?: boolean; onClose: () => void; onDone: () => void } =
		$props();

	let file = $state<File | null>(null);
	let title = $state('');
	let phase = $state<'idle' | 'uploading' | 'processing'>('idle');
	let progress = $state(0);
	let error = $state<string | null>(null);

	function pick(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		file = f;
		if (f && !title) title = f.name.replace(/\.[^.]+$/, '');
	}

	function reset() {
		file = null;
		title = '';
		phase = 'idle';
		progress = 0;
		error = null;
	}

	function close() {
		if (phase === 'uploading') return; // don't abandon an in-flight upload
		reset();
		onClose();
	}

	async function start() {
		if (!file) return;
		error = null;
		try {
			phase = 'uploading';
			progress = 0;
			const { asset_id, upload_url } = await api.createUpload({
				title: title.trim(),
				filename: file.name,
				size_bytes: file.size
			});
			await api.uploadToUrl(upload_url, file, (p) => (progress = p));
			phase = 'processing';
			await api.processUpload(asset_id);
			toast.success('Upload started');
			reset();
			onDone();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Upload failed';
			phase = 'idle';
			toast.error("Couldn't upload — try again");
		}
	}

	function mb(bytes: number) {
		const m = bytes / 1024 / 1024;
		return m >= 1024 ? `${(m / 1024).toFixed(2)} GB` : `${m.toFixed(1)} MB`;
	}
</script>

<Modal {open} title="Upload video" onClose={close}>
	<div class="space-y-4">
		<label
			class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] px-6 py-10 text-center transition-colors hover:border-[#ff5b3e]"
		>
			<UploadCloud size={28} class="text-[var(--color-muted)]" />
			{#if file}
				<span class="text-sm font-medium">{file.name}</span>
				<span class="text-xs text-[var(--color-muted)]">{mb(file.size)}</span>
			{:else}
				<span class="text-sm font-medium">Choose a video file</span>
				<span class="text-xs text-[var(--color-muted)]">MP4, MOV, MKV — up to 10 GB</span>
			{/if}
			<input type="file" accept="video/*" class="hidden" onchange={pick} disabled={phase !== 'idle'} />
		</label>

		<div>
			<label class="label" for="vod-title">Title</label>
			<input
				id="vod-title"
				class="input"
				bind:value={title}
				placeholder="My video"
				disabled={phase !== 'idle'}
			/>
		</div>

		{#if phase === 'uploading'}
			<div>
				<div class="mb-1 flex justify-between text-xs text-[var(--color-muted)]">
					<span>Uploading…</span>
					<span class="font-mono tabular-nums">{progress}%</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
					<div class="h-full bg-[#ff5b3e] transition-all" style="width: {progress}%"></div>
				</div>
			</div>
		{:else if phase === 'processing'}
			<p class="text-sm text-[var(--color-muted)]">
				Upload complete — queuing transcode. It will appear below and become playable when ready.
			</p>
		{/if}

		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}

		<div class="flex justify-end gap-2">
			<button class="btn-ghost" onclick={close} disabled={phase === 'uploading'}>Cancel</button>
			<button class="btn-primary" onclick={start} disabled={!file || phase !== 'idle'}>
				{phase === 'idle' ? 'Upload & transcode' : 'Working…'}
			</button>
		</div>
	</div>
</Modal>
