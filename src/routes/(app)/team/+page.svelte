<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import { auth } from '$lib/auth.svelte';
	import CopyField from '$lib/components/CopyField.svelte';

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
			qc.invalidateQueries({ queryKey: keys.teamInvitations });
		}
	}));

	const revoke = createMutation(() => ({
		mutationFn: (id: string) => api.revokeInvitation(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.teamInvitations })
	}));

	const roleColor: Record<string, string> = {
		owner: 'bg-violet-500/12 text-violet-500',
		admin: 'bg-sky-500/12 text-sky-500',
		member: 'bg-slate-500/12 text-slate-400'
	};
</script>

<header class="mb-6">
	<h1 class="text-2xl font-semibold">Team</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">Members of your organization and pending invites</p>
</header>

{#if inviteLink}
	<div class="card mb-6 border-violet-600/40 bg-violet-500/5 p-5">
		<p class="mb-2 text-sm font-medium text-violet-600">Invite created — share this link</p>
		<CopyField label="Invite link" value={inviteLink} />
	</div>
{/if}

<!-- invite form (owners/admins only) -->
{#if auth.isAdmin}
<form
	class="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
	onsubmit={(e) => {
		e.preventDefault();
		create.mutate();
	}}
>
	<div class="flex-1">
		<label class="label" for="email">Invite by email</label>
		<input id="email" class="input" type="email" bind:value={email} placeholder="teammate@example.com" required />
	</div>
	<div>
		<label class="label" for="role">Role</label>
		<select id="role" class="input w-auto" bind:value={role}>
			<option value="member">Member</option>
			<option value="admin">Admin</option>
			<option value="viewer">Viewer (read-only)</option>
		</select>
	</div>
	<button class="btn-primary" type="submit" disabled={create.isPending}>
		{create.isPending ? 'Inviting…' : 'Send invite'}
	</button>
</form>
{/if}

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
				<span class="rounded px-2 py-0.5 text-[11px] font-medium {roleColor[m.role] ?? ''}">{m.role}</span>
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
