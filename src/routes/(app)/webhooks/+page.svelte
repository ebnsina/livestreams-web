<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { toast } from '$lib/toast.svelte';
	import { webhookSchema, fieldErrors } from '$lib/schemas';
	import { Webhook, Plus } from '@lucide/svelte';

	let createOpen = $state(false);
	let urlError = $state('');

	const qc = useQueryClient();

	const endpoints = createQuery(() => ({
		queryKey: keys.webhooks,
		queryFn: () => api.webhooks()
	}));
	const deliveries = createQuery(() => ({
		queryKey: keys.webhookDeliveries,
		queryFn: () => api.webhookDeliveries(),
		refetchInterval: 5000
	}));

	const eps = $derived(endpoints.data?.data ?? []);
	const dels = $derived(deliveries.data?.data ?? []);

	let url = $state('');
	let newSecret = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: () => api.createWebhook({ url, events: ['*'] }),
		onSuccess: (ep) => {
			newSecret = ep.secret ?? null;
			url = '';
			createOpen = false;
			qc.invalidateQueries({ queryKey: keys.webhooks });
			toast.success('Webhook added');
		},
		onError: () => toast.error("Couldn't add webhook — try again")
	}));

	const remove = createMutation(() => ({
		mutationFn: (id: string) => api.deleteWebhook(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.webhooks });
			toast.success('Webhook deleted');
		},
		onError: () => toast.error("Couldn't delete webhook — try again")
	}));

	const redeliver = createMutation(() => ({
		mutationFn: (id: string) => api.redeliverWebhook(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.webhookDeliveries });
			toast.success('Redelivery queued');
		},
		onError: () => toast.error("Couldn't queue redelivery — try again")
	}));

	const statusColor: Record<string, string> = {
		success: 'text-emerald-500',
		failed: 'text-red-500',
		pending: 'text-amber-500'
	};
	function when(s: string) {
		return new Date(s).toLocaleString();
	}
</script>

<PageHeader
	icon={Webhook}
	title="Webhooks"
	subtitle="Signed HTTP callbacks for stream events (verify the X-LS-Signature HMAC-SHA256 header)"
>
	{#snippet actions()}
		{#if auth.canWrite}
			<button class="btn-primary" onclick={() => (createOpen = true)}>
				<Plus size={16} /> Add endpoint
			</button>
		{/if}
	{/snippet}
</PageHeader>

{#if newSecret}
	<div class="card mb-6 bg-[var(--color-accent)]/5 p-5">
		<p class="mb-2 text-sm font-medium text-[var(--color-accent)]">
			Signing secret — copy it now, shown only once
		</p>
		<CopyField label="Secret" value={newSecret} secret />
	</div>
{/if}

<Dialog bind:open={createOpen} title="Add endpoint" subtitle="Receive signed event callbacks">
	<form
		class="space-y-4"
		novalidate
		onsubmit={(e) => {
			e.preventDefault();
			const r = webhookSchema.safeParse({ url });
			if (!r.success) {
				urlError = fieldErrors(r.error).url ?? '';
				return;
			}
			urlError = '';
			create.mutate();
		}}
	>
		<div>
			<label class="label" for="url">Endpoint URL</label>
			<input id="url" class="input" bind:value={url} placeholder="https://example.com/webhooks" />
			{#if urlError}<p class="mt-1 text-xs text-red-500">{urlError}</p>{/if}
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (createOpen = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={create.isPending}>
				{create.isPending ? 'Adding…' : 'Add endpoint'}
			</button>
		</div>
	</form>
</Dialog>

<!-- endpoints -->
<section class="mb-8">
	<h2 class="mb-3 text-lg font-medium">Endpoints</h2>
	<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
		{#if eps.length === 0}
			<div class="p-8 text-center text-sm text-[var(--color-muted)]">No endpoints yet.</div>
		{:else}
			{#each eps as e (e.id)}
				<div class="flex items-center justify-between gap-3 p-4">
					<div class="min-w-0">
						<p class="truncate font-mono text-sm">{e.url}</p>
						<p class="text-xs text-[var(--color-muted)]">
							events: {e.events.join(', ')} · {e.enabled ? 'enabled' : 'disabled'}
						</p>
					</div>
					{#if auth.canWrite}
						<button class="btn-danger shrink-0 text-sm" onclick={() => remove.mutate(e.id)}>Delete</button>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</section>

<!-- deliveries -->
<section>
	<h2 class="mb-3 text-lg font-medium">Recent deliveries</h2>
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
		{#if dels.length === 0}
			<div class="p-8 text-center text-sm text-[var(--color-muted)]">No deliveries yet.</div>
		{:else}
			<table class="w-full min-w-[560px] text-sm">
				<thead
					class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
				>
					<tr>
						<th class="px-4 py-2.5 font-mono">Event</th>
						<th class="px-4 py-2.5 font-mono">Status</th>
						<th class="px-4 py-2.5 font-mono">Code</th>
						<th class="px-4 py-2.5 font-mono">Attempts</th>
						<th class="px-4 py-2.5 font-mono">When</th>
						<th class="px-4 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border)]">
					{#each dels as d (d.id)}
						<tr>
							<td class="px-4 py-2.5 font-mono text-[12px]">{d.event_type}</td>
							<td class="px-4 py-2.5 font-mono text-[12px] {statusColor[d.status] ?? ''}">{d.status}</td>
							<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{d.response_code ?? '—'}</td>
							<td class="px-4 py-2.5 font-mono text-[12px] tabular-nums">{d.attempts}</td>
							<td class="px-4 py-2.5 text-[12px] text-[var(--color-muted)]">{when(d.created_at)}</td>
							<td class="px-4 py-2.5 text-right">
								{#if auth.canWrite}
									<button
										class="text-[12px] font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
										onclick={() => redeliver.mutate(d.id)}
										disabled={redeliver.isPending}>Redeliver</button
									>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		</div>
	</div>
</section>
