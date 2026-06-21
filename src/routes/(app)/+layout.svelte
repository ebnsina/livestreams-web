<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { auth } from '$lib/auth.svelte';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import {
		LayoutDashboard,
		Radio,
		Film,
		Cpu,
		ScrollText,
		Webhook,
		KeyRound,
		Users,
		Settings
	} from '@lucide/svelte';

	let { children } = $props();

	$effect(() => {
		if (!auth.isAuthenticated) goto('/login', { replaceState: true });
	});

	const me = createQuery(() => ({
		queryKey: keys.me,
		queryFn: () => api.me(),
		enabled: auth.isAuthenticated
	}));

	$effect(() => {
		if (me.data?.user) auth.setUser(me.data.user);
		if (me.data) {
			auth.role = me.data.role;
			auth.activeOrgId = me.data.org_id;
		}
	});

	const orgs = $derived(me.data?.orgs ?? []);

	async function switchOrg(orgId: string) {
		if (orgId === auth.activeOrgId) return;
		const toks = await api.switchOrg(orgId);
		auth.setTokens(toks.access_token, toks.refresh_token);
		location.reload(); // reload all data under the new org
	}

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/streams', label: 'Streams', icon: Radio },
		{ href: '/recordings', label: 'Recordings', icon: Film },
		{ href: '/jobs', label: 'Jobs', icon: Cpu },
		{ href: '/logs', label: 'Logs', icon: ScrollText },
		{ href: '/webhooks', label: 'Webhooks', icon: Webhook },
		{ href: '/api-keys', label: 'API Keys', icon: KeyRound },
		{ href: '/team', label: 'Team', icon: Users },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function logout() {
		auth.clear();
		goto('/login');
	}
</script>

{#if auth.isAuthenticated}
	<div class="flex min-h-screen">
		<!-- Desktop sidebar (fixed: stays in place while main scrolls) -->
		<aside
			class="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto"
		>
			<div class="mb-8 flex items-center gap-2 px-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5b3e] text-sm font-bold text-white"
				>
					L
				</div>
				<span class="font-semibold">Livestreams</span>
			</div>

			<nav class="flex flex-1 flex-col gap-1">
				{#each nav as item (item.href)}
					{@const active = page.url.pathname.startsWith(item.href)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{active
							? 'bg-[#ff5b3e]/15 text-[#ff5b3e]'
							: 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'}"
					>
						<Icon size={16} />
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="pt-4">
				{#if orgs.length > 1}
					<select
						class="input mb-3 text-sm"
						value={auth.activeOrgId}
						onchange={(e) => switchOrg(e.currentTarget.value)}
					>
						{#each orgs as o (o.id)}
							<option value={o.id}>{o.name}</option>
						{/each}
					</select>
				{/if}
				<div class="mb-3 flex items-center justify-between gap-2">
					<div class="min-w-0 px-2 text-sm">
						<p class="truncate font-medium">{auth.user?.name ?? '—'}</p>
						<p class="truncate text-xs text-[var(--color-muted)]">
							{auth.role || auth.user?.email}
						</p>
					</div>
					<ThemeToggle />
				</div>
				<button class="btn-ghost w-full text-sm" onclick={logout}>Sign out</button>
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<!-- Mobile top bar (sticky) -->
			<header
				class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden"
			>
				<div class="flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff5b3e] text-xs font-bold text-white"
					>
						L
					</div>
					<span class="font-semibold">Livestreams</span>
				</div>
				<div class="flex items-center gap-2">
					<ThemeToggle />
					<button class="btn-ghost text-sm" onclick={logout}>Sign out</button>
				</div>
			</header>

			<!-- Mobile nav -->
			<nav
				class="flex gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 md:hidden"
			>
				{#each nav as item (item.href)}
					{@const active = page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						class="rounded-lg px-3 py-1.5 text-sm font-medium {active
							? 'bg-[#ff5b3e]/15 text-[#ff5b3e]'
							: 'text-[var(--color-muted)]'}">{item.label}</a
					>
				{/each}
			</nav>

			<!-- Main content -->
			<main class="min-w-0 flex-1">
				<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
{/if}
