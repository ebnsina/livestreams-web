<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { toast } from '$lib/toast.svelte';
	import { Users, Plus } from '@lucide/svelte';

	let inviteOpen = $state(false);

	const qc = useQueryClient();
	const members = createQuery(() => ({ queryKey: keys.teamMembers, queryFn: () => api.teamMembers() }));
	const invites = createQuery(() => ({
		queryKey: keys.teamInvitations,
		queryFn: () => api.teamInvitations()
	}));
	const memberList = $derived(members.data?.data ?? []);
	const inviteList = $derived(invites.data?.data ?? []);

	let email = $state('');
	let role = $state('member');
	let inviteLink = $state<string | null>(null);

	const create = createMutation(() => ({
		mutationFn: () => api.createInvitation(email, role),
		onSuccess: (inv) => {
			inviteLink = inv.token
				? `${location.origin}/invite?token=${encodeURIComponent(inv.token)}`
				: null;
			email = '';
			inviteOpen = false;
			qc.invalidateQueries({ queryKey: keys.teamInvitations });
			toast.success('Invite sent');
		},
		onError: () => toast.error("Couldn't send invite — try again")
	}));

	const revoke = createMutation(() => ({
		mutationFn: (id: string) => api.revokeInvitation(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.teamInvitations });
			toast.success('Invite revoked');
		},
		onError: () => toast.error("Couldn't revoke invite — try again")
	}));

	const roleColor: Record<string, string> = {
		owner: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]',
		admin: 'bg-sky-500/12 text-sky-500',
		member: 'bg-slate-500/12 text-slate-400'
	};
</script>

<PageHeader icon={Users} title="Team" subtitle="Members of your organization and pending invites">
	{#snippet actions()}
		{#if auth.isAdmin}
			<button class="btn-primary" onclick={() => (inviteOpen = true)}>
				<Plus size={16} /> Invite member
			</button>
		{/if}
	{/snippet}
</PageHeader>

{#if inviteLink}
	<div class="card mb-6 bg-[var(--color-accent)]/5 p-5">
		<p class="mb-2 text-sm font-medium text-[var(--color-accent)]">Invite created — share this link</p>
		<CopyField label="Invite link" value={inviteLink} />
	</div>
{/if}

<!-- invite dialog (owners/admins only) -->
<Dialog bind:open={inviteOpen} title="Invite member" subtitle="Send an invite link by email">
	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			create.mutate();
		}}
	>
		<div>
			<label class="label" for="email">Email</label>
			<input
				id="email"
				class="input"
				type="email"
				bind:value={email}
				placeholder="teammate@example.com"
				required
			/>
		</div>
		<div>
			<label class="label" for="role">Role</label>
			<select id="role" class="input" bind:value={role}>
				<option value="member">Member</option>
				<option value="admin">Admin</option>
				<option value="viewer">Viewer (read-only)</option>
			</select>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (inviteOpen = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={create.isPending}>
				{create.isPending ? 'Inviting…' : 'Send invite'}
			</button>
		</div>
	</form>
</Dialog>

<!-- members -->
<section class="mb-8">
	<h2 class="mb-3 text-lg font-medium">Members</h2>
	<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
		{#each memberList as m (m.id)}
			<div class="flex items-center justify-between p-4">
				<div class="min-w-0">
					<p class="truncate font-medium">{m.name || m.email}</p>
					<p class="truncate text-xs text-[var(--color-muted)]">{m.email}</p>
				</div>
				<span class="rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-tight {roleColor[m.role] ?? ''}">{m.role}</span>
			</div>
		{/each}
	</div>
</section>

<!-- pending invites -->
{#if inviteList.length > 0}
	<section>
		<h2 class="mb-3 text-lg font-medium">Pending invites</h2>
		<div class="card divide-y divide-[var(--color-border)] overflow-hidden">
			{#each inviteList as i (i.id)}
				<div class="flex items-center justify-between p-4">
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{i.email}</p>
						<p class="text-xs text-[var(--color-muted)]">invited as {i.role}</p>
					</div>
					{#if auth.isAdmin}
						<button class="btn-danger text-sm" onclick={() => revoke.mutate(i.id)}>Revoke</button>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}
