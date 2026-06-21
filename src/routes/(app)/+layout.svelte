<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { auth } from '$lib/auth.svelte';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

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
	});

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
		{ href: '/streams', label: 'Streams', icon: 'M4 6h16M4 12h16M4 18h10' },
		{ href: '/jobs', label: 'Jobs & Logs', icon: 'M4 5h16M4 12h16M4 19h16M8 5v14' }
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
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white"
				>
					L
				</div>
				<span class="font-semibold">Livestreams</span>
			</div>

			<nav class="flex flex-1 flex-col gap-1">
				{#each nav as item (item.href)}
					{@const active = page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{active
							? 'bg-teal-500/15 text-teal-400'
							: 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'}"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d={item.icon} />
						</svg>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="border-t border-[var(--color-border)] pt-4">
				<div class="mb-3 flex items-center justify-between gap-2">
					<div class="min-w-0 px-2 text-sm">
						<p class="truncate font-medium">{auth.user?.name ?? '—'}</p>
						<p class="truncate text-xs text-[var(--color-muted)]">{auth.user?.email ?? ''}</p>
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
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white"
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
							? 'bg-teal-500/15 text-teal-400'
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
