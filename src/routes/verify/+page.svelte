<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';

	let state = $state<'verifying' | 'ok' | 'error'>('verifying');

	onMount(async () => {
		const token = page.url.searchParams.get('token') ?? '';
		if (!token) {
			state = 'error';
			return;
		}
		try {
			await api.verifyEmail(token);
			state = 'ok';
			if (auth.user) auth.setUser({ ...auth.user, email_verified: true });
			toast.success('Email verified');
			setTimeout(() => goto(auth.isAuthenticated ? '/dashboard' : '/login'), 1200);
		} catch {
			state = 'error';
		}
	});
</script>

<svelte:head><title>Verify email · Livestreams</title></svelte:head>

<AuthShell>
	{#if state === 'verifying'}
		<h1 class="text-2xl font-semibold tracking-tight">Verifying your email…</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">Hang tight for a moment.</p>
	{:else if state === 'ok'}
		<h1 class="text-2xl font-semibold tracking-tight text-emerald-500">Email verified ✓</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">Redirecting…</p>
	{:else}
		<h1 class="text-2xl font-semibold tracking-tight text-red-500">Verification failed</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">
			This link is invalid or has expired. Sign in and resend it from the banner.
		</p>
		<a class="mt-4 inline-block font-medium text-[var(--color-accent)] hover:underline" href="/login"
			>Sign in</a
		>
	{/if}
</AuthShell>
