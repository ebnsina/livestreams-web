<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { keys } from '$lib/query';

	const qc = useQueryClient();
	const me = createQuery(() => ({ queryKey: keys.me, queryFn: () => api.me() }));
	const user = $derived(me.data?.user);
	const orgs = $derived(me.data?.orgs ?? []);

	let name = $state('');
	$effect(() => {
		if (user && !name) name = user.name;
	});

	const saveName = createMutation(() => ({
		mutationFn: () => api.updateProfile(name),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.me })
	}));

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let pwDone = $state(false);

	const changePw = createMutation(() => ({
		mutationFn: () => api.changePassword(current, next),
		onSuccess: () => {
			pwDone = true;
			current = next = confirm = '';
			setTimeout(() => (pwDone = false), 3000);
		}
	}));

	function submitPw(e: SubmitEvent) {
		e.preventDefault();
		if (next !== confirm) return;
		changePw.mutate();
	}
</script>

<header class="mb-6">
	<h1 class="text-2xl font-semibold">Settings</h1>
	<p class="mt-1 text-sm text-[var(--color-muted)]">Manage your account</p>
</header>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Profile -->
	<section class="card p-5">
		<h2 class="mb-4 text-[15px] font-semibold">Profile</h2>
		<div class="mb-4 text-sm">
			<p class="text-[var(--color-muted)]">Email</p>
			<p class="font-medium">{user?.email ?? '—'}</p>
		</div>
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				saveName.mutate();
			}}
		>
			<div>
				<label class="label" for="name">Display name</label>
				<input id="name" class="input" bind:value={name} required />
			</div>
			<button class="btn-primary" type="submit" disabled={saveName.isPending}>
				{saveName.isPending ? 'Saving…' : 'Save'}
			</button>
		</form>
	</section>

	<!-- Password -->
	<section class="card p-5">
		<h2 class="mb-4 text-[15px] font-semibold">Change password</h2>
		<form class="space-y-3" onsubmit={submitPw}>
			<div>
				<label class="label" for="cur">Current password</label>
				<input id="cur" class="input" type="password" bind:value={current} required />
			</div>
			<div>
				<label class="label" for="new">New password</label>
				<input id="new" class="input" type="password" bind:value={next} minlength="8" required />
			</div>
			<div>
				<label class="label" for="conf">Confirm new password</label>
				<input id="conf" class="input" type="password" bind:value={confirm} required />
			</div>
			{#if next && confirm && next !== confirm}
				<p class="text-sm text-red-500">Passwords don't match</p>
			{/if}
			{#if changePw.isError}
				<p class="text-sm text-red-500">{(changePw.error as ApiError)?.message ?? 'Failed'}</p>
			{/if}
			{#if pwDone}<p class="text-sm text-emerald-500">Password updated</p>{/if}
			<button class="btn-primary" type="submit" disabled={changePw.isPending}>
				{changePw.isPending ? 'Updating…' : 'Update password'}
			</button>
		</form>
	</section>

	<!-- Organizations -->
	<section class="card p-5 lg:col-span-2">
		<h2 class="mb-4 text-[15px] font-semibold">Organizations</h2>
		<ul class="divide-y divide-[var(--color-border)]">
			{#each orgs as o (o.id)}
				<li class="flex items-center justify-between py-2 text-sm">
					<span class="font-medium">{o.name}</span>
					<span class="font-mono text-xs text-[var(--color-muted)]">{o.role}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>
