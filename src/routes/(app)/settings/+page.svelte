<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { keys } from '$lib/query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Settings } from '@lucide/svelte';

	const qc = useQueryClient();
	const me = createQuery(() => ({ queryKey: keys.me, queryFn: () => api.me() }));
	const user = $derived(me.data?.user);
	const orgs = $derived(me.data?.orgs ?? []);

	// OAuth connected accounts
	const providers = createQuery(() => ({
		queryKey: keys.oauthProviders,
		queryFn: () => api.oauthProviders()
	}));
	const connections = createQuery(() => ({
		queryKey: keys.oauthConnections,
		queryFn: () => api.oauthConnections()
	}));
	const providerList = $derived(providers.data?.providers ?? []);
	const connList = $derived(connections.data?.data ?? []);

	const disconnect = createMutation(() => ({
		mutationFn: (id: string) => api.deleteOauthConnection(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.oauthConnections })
	}));

	async function connect(platform: string) {
		const { redirect_url } = await api.oauthAuthorize(platform);
		window.location.href = redirect_url;
	}

	const platformLabel: Record<string, string> = {
		youtube: 'YouTube',
		twitch: 'Twitch',
		mock: 'Mock (test)'
	};

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

	const setEmail = createMutation(() => ({
		mutationFn: (enabled: boolean) => api.setEmailNotifications(enabled),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.me })
	}));
</script>

<PageHeader icon={Settings} title="Settings" subtitle="Manage your account" />

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

	<!-- Notifications -->
	<section class="card p-5 lg:col-span-2">
		<h2 class="mb-1 text-[15px] font-semibold">Notifications</h2>
		<p class="mb-4 text-sm text-[var(--color-muted)]">
			In-app alerts always appear in the bell. Optionally also receive them by email.
		</p>
		<div class="flex items-center justify-between">
			<div class="text-sm">
				<p class="font-medium">Email notifications</p>
				<p class="text-xs text-[var(--color-muted)]">
					Stream live/offline, recordings & transcodes, health alerts
				</p>
			</div>
			<button
				class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors {user?.email_notifications
					? 'bg-[#ff5b3e]'
					: 'bg-[var(--color-border)]'}"
				onclick={() => setEmail.mutate(!user?.email_notifications)}
				disabled={setEmail.isPending}
				aria-label="Toggle email notifications"
			>
				<span
					class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform {user?.email_notifications
						? 'translate-x-5'
						: 'translate-x-0.5'}"
				></span>
			</button>
		</div>
	</section>

	<!-- Connected accounts -->
	<section class="card p-5 lg:col-span-2">
		<h2 class="mb-1 text-[15px] font-semibold">Connected accounts</h2>
		<p class="mb-4 text-sm text-[var(--color-muted)]">
			Link platform accounts for multistreaming.
		</p>

		{#if connList.length > 0}
			<ul class="mb-4 divide-y divide-[var(--color-border)]">
				{#each connList as c (c.id)}
					<li class="flex items-center justify-between py-2 text-sm">
						<span>
							<span class="font-medium">{platformLabel[c.platform] ?? c.platform}</span>
							<span class="text-[var(--color-muted)]">· {c.account_name || 'connected'}</span>
						</span>
						<button class="btn-danger text-sm" onclick={() => disconnect.mutate(c.id)}>Disconnect</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if providerList.length === 0}
			<p class="text-sm text-[var(--color-muted)]">
				No OAuth providers configured. Set the provider client IDs in the API environment to enable
				connecting YouTube/Twitch.
			</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each providerList as p (p)}
					<button class="btn-ghost text-sm" onclick={() => connect(p)}>
						Connect {platformLabel[p] ?? p}
					</button>
				{/each}
			</div>
		{/if}
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
