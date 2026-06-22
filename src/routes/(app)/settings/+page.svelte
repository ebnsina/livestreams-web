<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { keys } from '$lib/query';
	import { toast } from '$lib/toast.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CopyField from '$lib/components/CopyField.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { theme } from '$lib/theme.svelte';
	import { profileSchema, changePasswordSchema, fieldErrors } from '$lib/schemas';
	import {
		Settings,
		Pencil,
		Sun,
		Moon,
		User,
		Lock,
		Palette,
		Bell,
		Link2,
		Building2
	} from '@lucide/svelte';

	let profileOpen = $state(false);
	let pwOpen = $state(false);

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

	const importKey = createMutation(() => ({
		mutationFn: (id: string) => api.importStreamKey(id),
		onSuccess: (dest) => {
			toast.success(
				dest.updated
					? `Refreshed stream key for “${dest.name}”`
					: `Added “${dest.name}” to your destinations`
			);
		},
		onError: (e) =>
			toast.error((e as ApiError)?.message ?? 'Could not fetch stream key from the platform')
	}));

	// BYO OAuth credentials (per-org)
	const provConfigs = createQuery(() => ({
		queryKey: keys.oauthProviderConfigs,
		queryFn: () => api.oauthProviderConfigs()
	}));
	const provList = $derived(provConfigs.data?.data ?? []);
	let creds = $state<Record<string, { id: string; secret: string }>>({});
	$effect(() => {
		for (const pc of provList) {
			if (!creds[pc.platform]) creds[pc.platform] = { id: pc.client_id, secret: '' };
		}
	});

	const saveCfg = createMutation(() => ({
		mutationFn: (p: { platform: string; client_id: string; client_secret: string }) =>
			api.setOauthProviderConfig(p),
		onSuccess: () => {
			toast.success('Credentials saved');
			qc.invalidateQueries({ queryKey: keys.oauthProviderConfigs });
			qc.invalidateQueries({ queryKey: keys.oauthProviders });
		},
		onError: () => toast.error('Could not save credentials')
	}));
	const delCfg = createMutation(() => ({
		mutationFn: (platform: string) => api.deleteOauthProviderConfig(platform),
		onSuccess: () => {
			toast.success('Credentials removed');
			qc.invalidateQueries({ queryKey: keys.oauthProviderConfigs });
			qc.invalidateQueries({ queryKey: keys.oauthProviders });
		},
		onError: () => toast.error('Could not remove credentials')
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
	let nameError = $state('');
	$effect(() => {
		if (user && !name) name = user.name;
	});

	const saveName = createMutation(() => ({
		mutationFn: () => api.updateProfile(name),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.me });
			toast.success('Profile updated');
			profileOpen = false;
		},
		onError: () => toast.error('Could not update profile')
	}));

	function submitProfile(e: SubmitEvent) {
		e.preventDefault();
		const r = profileSchema.safeParse({ name });
		if (!r.success) {
			nameError = fieldErrors(r.error).name ?? '';
			return;
		}
		nameError = '';
		saveName.mutate();
	}

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let pwErrors = $state<Record<string, string>>({});

	const changePw = createMutation(() => ({
		mutationFn: () => api.changePassword(current, next),
		onSuccess: () => {
			current = next = confirm = '';
			toast.success('Password updated');
			pwOpen = false;
		},
		onError: () => toast.error("Couldn't update password — check your current one")
	}));

	function submitPw(e: SubmitEvent) {
		e.preventDefault();
		const r = changePasswordSchema.safeParse({ current, next, confirm });
		if (!r.success) {
			pwErrors = fieldErrors(r.error);
			return;
		}
		pwErrors = {};
		changePw.mutate();
	}

	const setEmail = createMutation(() => ({
		mutationFn: (enabled: boolean) => api.setEmailNotifications(enabled),
		onSuccess: (_d, enabled) => {
			qc.invalidateQueries({ queryKey: keys.me });
			toast.success(enabled ? 'Email notifications on' : 'Email notifications off');
		}
	}));
</script>

<PageHeader icon={Settings} title="Settings" subtitle="Manage your account" />

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Profile -->
	<section class="card p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-base font-semibold">
				<User size={16} class="text-[var(--color-accent)]" /> Profile
			</h2>
			<button class="btn-ghost px-4 py-2 text-sm" onclick={() => (profileOpen = true)}>
				<Pencil size={15} /> Edit
			</button>
		</div>
		<dl class="space-y-3 text-sm">
			<div>
				<dt class="text-[var(--color-muted)]">Email</dt>
				<dd class="font-medium">{user?.email ?? '—'}</dd>
			</div>
			<div>
				<dt class="text-[var(--color-muted)]">Display name</dt>
				<dd class="font-medium">{user?.name ?? '—'}</dd>
			</div>
		</dl>
	</section>

	<!-- Password -->
	<section class="card flex flex-col p-6">
		<div class="mb-2 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-base font-semibold">
				<Lock size={16} class="text-[var(--color-accent)]" /> Password
			</h2>
		</div>
		<p class="mb-4 flex-1 text-sm text-[var(--color-muted)]">
			Keep your account secure with a strong, unique password.
		</p>
		<button class="btn-ghost w-fit px-4 py-2 text-sm" onclick={() => (pwOpen = true)}>
			Change password
		</button>
	</section>

	<!-- Appearance -->
	<section class="card p-6 lg:col-span-2">
		<h2 class="mb-1 flex items-center gap-2 text-base font-semibold">
			<Palette size={16} class="text-[var(--color-accent)]" /> Appearance
		</h2>
		<p class="mb-4 text-sm text-[var(--color-muted)]">Choose how the dashboard looks.</p>
		<div class="squircle inline-flex gap-1 rounded-xl bg-[var(--color-surface-2)] p-1">
			<button
				class="squircle flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors {theme.mode ===
				'light'
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)]'}"
				onclick={() => theme.mode === 'dark' && theme.toggle()}
			>
				<Sun size={15} /> Light
			</button>
			<button
				class="squircle flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors {theme.mode ===
				'dark'
					? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
					: 'text-[var(--color-muted)]'}"
				onclick={() => theme.mode === 'light' && theme.toggle()}
			>
				<Moon size={15} /> Dark
			</button>
		</div>
	</section>

	<!-- Notifications -->
	<section class="card p-5 lg:col-span-2">
		<h2 class="mb-1 flex items-center gap-2 text-[15px] font-semibold">
			<Bell size={16} class="text-[var(--color-accent)]" /> Notifications
		</h2>
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
					? 'bg-[var(--color-accent)]'
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
		<h2 class="mb-1 flex items-center gap-2 text-[15px] font-semibold">
			<Link2 size={16} class="text-[var(--color-accent)]" /> Connected accounts
		</h2>
		<p class="mb-4 text-sm text-[var(--color-muted)]">
			Link platform accounts for multistreaming. Provide your own OAuth app credentials below —
			register an app on the platform with the redirect URI shown, then paste the client ID/secret.
		</p>

		<!-- BYO OAuth credentials -->
		<div class="mb-5 space-y-3">
			{#each provList as pc (pc.platform)}
				<div class="rounded-lg border border-[var(--color-border)] p-3">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium">{platformLabel[pc.platform] ?? pc.platform}</span>
						{#if pc.configured}<span class="text-xs text-emerald-500">credentials saved</span>{/if}
					</div>
					<CopyField label="Redirect URI (register this in the provider console)" value={pc.redirect_uri} />
					{#if creds[pc.platform]}
						<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
							<input class="input" placeholder="Client ID" bind:value={creds[pc.platform].id} />
							<input
								class="input"
								type="password"
								placeholder={pc.configured ? '•••••• (set; re-enter to change)' : 'Client secret'}
								bind:value={creds[pc.platform].secret}
							/>
						</div>
						<div class="mt-2 flex gap-2">
							<button
								class="btn-primary text-sm"
								disabled={saveCfg.isPending || !creds[pc.platform].id || !creds[pc.platform].secret}
								onclick={() =>
									saveCfg.mutate({
										platform: pc.platform,
										client_id: creds[pc.platform].id,
										client_secret: creds[pc.platform].secret
									})}
							>
								Save
							</button>
							{#if pc.configured}
								<button class="btn-ghost text-sm" onclick={() => delCfg.mutate(pc.platform)}>Remove</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if connList.length > 0}
			<ul class="mb-4 divide-y divide-[var(--color-border)]">
				{#each connList as c (c.id)}
					<li class="flex items-center justify-between py-2 text-sm">
						<span>
							<span class="font-medium">{platformLabel[c.platform] ?? c.platform}</span>
							<span class="text-[var(--color-muted)]">· {c.account_name || 'connected'}</span>
						</span>
						<span class="flex gap-2">
							{#if c.platform === 'youtube' || c.platform === 'twitch'}
								<button
									class="btn-ghost text-sm"
									disabled={importKey.isPending}
									onclick={() => importKey.mutate(c.id)}
								>
									{importKey.isPending && importKey.variables === c.id
										? 'Fetching…'
										: 'Import stream key'}
								</button>
							{/if}
							<button class="btn-danger text-sm" onclick={() => disconnect.mutate(c.id)}>Disconnect</button>
						</span>
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
	<section class="card p-6 lg:col-span-2">
		<h2 class="mb-4 flex items-center gap-2 text-base font-semibold">
			<Building2 size={16} class="text-[var(--color-accent)]" /> Organizations
		</h2>
		<ul class="divide-y divide-[var(--color-border)]">
			{#each orgs as o (o.id)}
				<li class="flex items-center justify-between py-2.5 text-sm">
					<span class="font-medium">{o.name}</span>
					<span class="font-mono text-xs text-[var(--color-muted)]">{o.role}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<!-- Edit profile dialog -->
<Dialog bind:open={profileOpen} title="Edit profile" subtitle="Update your display name">
	<form class="space-y-4" novalidate onsubmit={submitProfile}>
		<div>
			<label class="label" for="name">Display name</label>
			<input id="name" class="input" bind:value={name} />
			{#if nameError}<p class="mt-1 text-xs text-red-500">{nameError}</p>{/if}
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (profileOpen = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={saveName.isPending}>
				{saveName.isPending ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</form>
</Dialog>

<!-- Change password dialog -->
<Dialog bind:open={pwOpen} title="Change password" subtitle="Choose a new password">
	<form class="space-y-4" novalidate onsubmit={submitPw}>
		<div>
			<label class="label" for="cur">Current password</label>
			<input id="cur" class="input" type="password" bind:value={current} />
			{#if pwErrors.current}<p class="mt-1 text-xs text-red-500">{pwErrors.current}</p>{/if}
		</div>
		<div>
			<label class="label" for="new">New password</label>
			<input id="new" class="input" type="password" bind:value={next} />
			{#if pwErrors.next}<p class="mt-1 text-xs text-red-500">{pwErrors.next}</p>{/if}
		</div>
		<div>
			<label class="label" for="conf">Confirm new password</label>
			<input id="conf" class="input" type="password" bind:value={confirm} />
			{#if pwErrors.confirm}<p class="mt-1 text-xs text-red-500">{pwErrors.confirm}</p>{/if}
		</div>
		{#if changePw.isError}
			<p class="text-sm text-red-500">{(changePw.error as ApiError)?.message ?? 'Failed'}</p>
		{/if}
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn-ghost" onclick={() => (pwOpen = false)}>Cancel</button>
			<button class="btn-primary" type="submit" disabled={changePw.isPending}>
				{changePw.isPending ? 'Updating…' : 'Update password'}
			</button>
		</div>
	</form>
</Dialog>
