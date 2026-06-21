<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { keys } from '$lib/query';

	const qc = useQueryClient();
	const token = $derived(page.url.searchParams.get('token') ?? '');

	const accept = createMutation(() => ({
		mutationFn: () => api.acceptInvitation(token),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.me });
			setTimeout(() => goto('/dashboard'), 1200);
		}
	}));
</script>

<div class="mx-auto max-w-md py-10">
	<div class="card p-6 text-center">
		<h1 class="text-xl font-semibold">Team invitation</h1>
		{#if !token}
			<p class="mt-2 text-sm text-red-500">This invite link is missing its token.</p>
		{:else if accept.isSuccess}
			<p class="mt-2 text-sm text-emerald-500">You've joined the organization. Redirecting…</p>
		{:else}
			<p class="mt-2 text-sm text-[var(--color-muted)]">
				Accept this invite to join the organization with your current account.
			</p>
			{#if accept.isError}
				<p class="mt-2 text-sm text-red-500">{(accept.error as ApiError)?.message ?? 'Failed'}</p>
			{/if}
			<button class="btn-primary mt-4" onclick={() => accept.mutate()} disabled={accept.isPending}>
				{accept.isPending ? 'Accepting…' : 'Accept invite'}
			</button>
		{/if}
	</div>
</div>
