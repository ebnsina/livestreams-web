<script lang="ts">
	import { api } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import Dialog from './Dialog.svelte';
	import CopyField from './CopyField.svelte';
	import { ShieldCheck } from '@lucide/svelte';

	let {
		open = $bindable(false),
		kind,
		id
	}: { open?: boolean; kind: 'live' | 'vod'; id: string } = $props();

	let ttl = $state(21600); // 6h
	let domain = $state('');
	let url = $state('');
	let expires = $state('');
	let busy = $state(false);

	const ttls = [
		{ v: 3600, label: '1 hour' },
		{ v: 21600, label: '6 hours' },
		{ v: 86400, label: '1 day' },
		{ v: 604800, label: '7 days' }
	];

	async function generate() {
		busy = true;
		try {
			const r = await api.signPlayback({ kind, id, ttl_sec: ttl, domain: domain.trim() || undefined });
			url = r.url;
			expires = new Date(r.expires_at).toLocaleString();
		} catch {
			toast.error('Could not generate a secure link');
		} finally {
			busy = false;
		}
	}
</script>

<Dialog bind:open title="Secure playback link" subtitle="Time-limited, optionally domain-locked">
	<div class="space-y-4">
		<div>
			<label class="label" for="ttl">Expires after</label>
			<select id="ttl" class="input" bind:value={ttl}>
				{#each ttls as t (t.v)}
					<option value={t.v}>{t.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="dom">Restrict to domain (optional)</label>
			<input id="dom" class="input" placeholder="example.com" bind:value={domain} />
			<p class="mt-1 text-xs text-[var(--color-muted)]">
				Leave empty to allow playback from anywhere.
			</p>
		</div>

		{#if url}
			<CopyField label="Signed URL — expires {expires}" value={url} />
		{/if}

		<div class="flex justify-end gap-2 pt-1">
			<button type="button" class="btn-ghost" onclick={() => (open = false)}>Close</button>
			<button class="btn-primary" onclick={generate} disabled={busy}>
				<ShieldCheck size={16} />
				{busy ? 'Generating…' : url ? 'Regenerate' : 'Generate link'}
			</button>
		</div>
	</div>
</Dialog>
