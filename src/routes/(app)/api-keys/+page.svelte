<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import CopyField from '$lib/components/CopyField.svelte';

	const qc = useQueryClient();

	const list = createQuery(() => ({ queryKey: keys.apiKeys, queryFn: () => api.apiKeys() }));
	const items = $derived(list.data?.data ?? []);

	let name = $state('');
	let newKey = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: () => api.createApiKey(name),
		onSuccess: (k) => {
			newKey = k.key ?? null;
			name = '';
			qc.invalidateQueries({ queryKey: keys.apiKeys });
		}
	}));

	const revoke = createMutation(() => ({
		mutationFn: (id: string) => api.revokeApiKey(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.apiKeys })
	}));

	function when(s?: string) {
		return s ? new Date(s).toLocaleString() : 'never';
	}
</script>

<header class="mb-6">
	<h1 class="text-2xl font-semibold">API Keys</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">
		Use a key as <code class="font-mono text-xs">Authorization: Bearer lsk_…</code> to call the API
		programmatically (full account access).
	</p>
</header>

{#if newKey}
	<div class="card mb-6 border-violet-600/40 bg-violet-500/5 p-5">
		<p class="mb-2 text-sm font-medium text-violet-600">API key created — copy it now, shown only once</p>
		<CopyField label="Key" value={newKey} secret />
	</div>
{/if}

<form
	class="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
	onsubmit={(e) => {
		e.preventDefault();
		create.mutate();
	}}
>
	<div class="flex-1">
		<label class="label" for="name">Key name</label>
		<input id="name" class="input" bind:value={name} placeholder="CI pipeline" required />
	</div>
	<button class="btn-primary" type="submit" disabled={create.isPending}>
		{create.isPending ? 'Creating…' : 'Create key'}
	</button>
</form>

<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
	{#if items.length === 0}
		<div class="p-8 text-center text-sm text-[var(--color-muted)]">No API keys yet.</div>
	{:else}
		{#each items as k (k.id)}
			<div class="flex items-center justify-between gap-3 p-4">
				<div class="min-w-0">
					<p class="truncate font-medium">{k.name}</p>
					<p class="font-mono text-[11px] text-[var(--color-muted)]">
						{k.prefix}… · last used {when(k.last_used_at)}
					</p>
				</div>
				<button class="btn-danger shrink-0 text-sm" onclick={() => revoke.mutate(k.id)}>Revoke</button>
			</div>
		{/each}
	{/if}
</div>
