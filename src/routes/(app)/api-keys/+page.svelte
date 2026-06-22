<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { toast } from '$lib/toast.svelte';
	import { KeyRound, Plus } from '@lucide/svelte';

	let createOpen = $state(false);

	const qc = useQueryClient();

	const list = createQuery(() => ({ queryKey: keys.apiKeys, queryFn: () => api.apiKeys() }));
	const items = $derived(list.data?.data ?? []);

	let name = $state('');
	let access = $state<'full' | 'read'>('full');
	let newKey = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: () => api.createApiKey(name, access === 'read' ? ['read'] : ['*']),
		onSuccess: (k) => {
			newKey = k.key ?? null;
			name = '';
			createOpen = false;
			qc.invalidateQueries({ queryKey: keys.apiKeys });
			toast.success('API key created');
		},
		onError: () => toast.error("Couldn't create API key — try again")
	}));

	function isReadOnly(scopes: string[]) {
		return scopes.length > 0 && !scopes.includes('*') && !scopes.includes('write');
	}

	const revoke = createMutation(() => ({
		mutationFn: (id: string) => api.revokeApiKey(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.apiKeys });
			toast.success('Key revoked');
		},
		onError: () => toast.error("Couldn't revoke key — try again")
	}));

	function when(s?: string) {
		return s ? new Date(s).toLocaleString() : 'never';
	}
</script>

<PageHeader
	icon={KeyRound}
	title="API Keys"
	subtitle="Use a key as Authorization: Bearer lsk_… to call the API programmatically"
>
	{#snippet actions()}
		{#if auth.canWrite}
			<button class="btn-primary" onclick={() => (createOpen = true)}>
				<Plus size={16} /> Create key
			</button>
		{/if}
	{/snippet}
</PageHeader>

{#if newKey}
	<div class="card mb-6 bg-[var(--color-accent)]/5 p-5">
		<p class="mb-2 text-sm font-medium text-[var(--color-accent)]">
			API key created — copy it now, shown only once
		</p>
		<CopyField label="Key" value={newKey} secret />
	</div>
{/if}

<Dialog bind:open={createOpen} title="Create API key" subtitle="Generate a key to call the API">
	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			create.mutate();
		}}
	>
		<div>
			<label class="label" for="name">Key name</label>
			<input id="name" class="input" bind:value={name} placeholder="CI pipeline" required />
		</div>
		<div>
			<label class="label" for="access">Access</label>
			<select id="access" class="input" bind:value={access}>
				<option value="full">Read &amp; write</option>
				<option value="read">Read only</option>
			</select>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (createOpen = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={create.isPending}>
				{create.isPending ? 'Creating…' : 'Create key'}
			</button>
		</div>
	</form>
</Dialog>

<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
	{#if items.length === 0}
		<div class="p-8 text-center text-sm text-[var(--color-muted)]">No API keys yet.</div>
	{:else}
		{#each items as k (k.id)}
			<div class="flex items-center justify-between gap-3 p-4">
				<div class="min-w-0">
					<p class="flex items-center gap-2 font-medium">
						{k.name}
						<span
							class="rounded px-1.5 py-0.5 text-[10px] font-medium {isReadOnly(k.scopes)
								? 'bg-sky-500/12 text-sky-500'
								: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'}"
						>
							{isReadOnly(k.scopes) ? 'read-only' : 'read & write'}
						</span>
					</p>
					<p class="font-mono text-[11px] text-[var(--color-muted)]">
						{k.prefix}… · last used {when(k.last_used_at)}
					</p>
				</div>
				{#if auth.canWrite}
					<button class="btn-danger shrink-0 text-sm" onclick={() => revoke.mutate(k.id)}>Revoke</button>
				{/if}
			</div>
		{/each}
	{/if}
</div>
