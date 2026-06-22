<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { auth } from '$lib/auth.svelte';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import NotificationsBell from '$lib/components/NotificationsBell.svelte';
	import {
		LayoutDashboard,
		Radio,
		Film,
		FileVideo,
		BarChart3,
		Cpu,
		ScrollText,
		Webhook,
		KeyRound,
		Users,
		Settings,
		LogOut
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

	const nav: {
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
	}[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/streams', label: 'Streams', icon: Radio },
		{ href: '/recordings', label: 'Recordings', icon: Film },
		{ href: '/transcodes', label: 'Transcodes', icon: FileVideo },
		{ href: '/analytics', label: 'Analytics', icon: BarChart3 },
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

	// Derive the active nav entry (sub-routes like /streams/[id] inherit parent).
	const active = $derived(
		[...nav]
			.filter((n) => page.url.pathname.startsWith(n.href))
			.sort((a, b) => b.href.length - a.href.length)[0]
	);
	const pageTitle = $derived(active ? `${active.label} · Livestreams` : 'Livestreams');

	const initials = $derived(
		(auth.user?.name ?? '?')
			.split(' ')
			.map((p) => p[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<svelte:head><title>{pageTitle}</title></svelte:head>

{#if auth.isAuthenticated}
	<div class="flex min-h-screen bg-[var(--color-bg)]">
		<!-- Sidebar (desktop) — borderless, icon + label, white hover -->
		<aside class="sticky top-0 hidden h-screen w-64 shrink-0 p-3 md:block">
			<div class="flex h-full flex-col px-2 py-2 text-[var(--color-text)]">
				<!-- logo -->
				<a href="/dashboard" class="mb-6 flex items-center gap-2.5 px-2 pt-1">
					<div
						class="squircle flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-base font-bold text-white"
						style="box-shadow: var(--shadow-accent)"
					>
						L
					</div>
					<span class="text-lg font-semibold">Livestreams</span>
				</a>

				<!-- nav -->
				<nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
					{#each nav as item (item.href)}
						{@const isActive = page.url.pathname.startsWith(item.href)}
						{@const Icon = item.icon}
						<a
							href={item.href}
							class="squircle flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
								{isActive
								? 'bg-[var(--color-accent)] text-white'
								: 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'}"
							style={isActive ? 'box-shadow: var(--shadow-accent)' : ''}
						>
							<Icon size={18} class="shrink-0" />
							<span class="flex-1">{item.label}</span>
						</a>
					{/each}
				</nav>

				<!-- user + logout -->
				<div class="mt-3 border-t border-[var(--color-border)] pt-3">
					<div class="flex items-center gap-2.5 px-1">
						<div
							class="squircle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-xs font-semibold"
						>
							{initials}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{auth.user?.name ?? '—'}</p>
							<p class="truncate text-xs text-[var(--color-muted)]">
								{auth.role || auth.user?.email}
							</p>
						</div>
						<button
							class="squircle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
							onclick={logout}
							aria-label="Sign out"
						>
							<LogOut size={16} />
						</button>
					</div>
				</div>
			</div>
		</aside>

		<!-- Content area — one full white squircle panel -->
		<div class="flex min-w-0 flex-1 flex-col p-3 md:pl-0">
			<div
				class="squircle flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[26px] bg-[var(--color-surface)]"
				style="box-shadow: var(--shadow-panel)"
			>
				<!-- Top bar -->
				<header class="flex shrink-0 items-center gap-3 px-5 py-4 sm:px-8">
					<!-- mobile logo -->
					<a
						href="/dashboard"
						class="squircle flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white md:hidden"
					>
						L
					</a>
					<div class="min-w-0 flex-1"></div>

					{#if orgs.length > 1}
						<select
							class="input hidden w-auto py-2 sm:block"
							value={auth.activeOrgId}
							onchange={(e) => switchOrg(e.currentTarget.value)}
						>
							{#each orgs as o (o.id)}
								<option value={o.id}>{o.name}</option>
							{/each}
						</select>
					{/if}

					<div class="squircle flex items-center rounded-xl bg-[var(--color-surface-2)] px-1 py-1">
						<NotificationsBell />
					</div>
				</header>

				<!-- Mobile nav (scrollable pills) -->
				<nav class="flex gap-1.5 overflow-x-auto px-5 pb-2 md:hidden">
					{#each nav as item (item.href)}
						{@const isActive = page.url.pathname.startsWith(item.href)}
						<a
							href={item.href}
							class="squircle shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium {isActive
								? 'bg-[var(--color-accent)] text-white'
								: 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'}">{item.label}</a
						>
					{/each}
				</nav>

				<!-- Scrollable content -->
				<main class="min-w-0 flex-1 overflow-y-auto px-5 pb-12 pt-2 sm:px-8">
					<div class="mx-auto w-full max-w-6xl">
						{@render children()}
					</div>
				</main>
			</div>
		</div>
	</div>
{/if}
