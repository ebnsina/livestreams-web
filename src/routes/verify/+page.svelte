<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';

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

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm text-center">
		<div
			class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5b3e] text-lg font-bold text-white"
		>
			L
		</div>
		{#if state === 'verifying'}
			<h1 class="text-xl font-semibold">Verifying your email…</h1>
		{:else if state === 'ok'}
			<h1 class="text-xl font-semibold text-emerald-500">Email verified ✓</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">Redirecting…</p>
		{:else}
			<h1 class="text-xl font-semibold text-red-500">Verification failed</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				This link is invalid or has expired. Sign in and resend it from the banner.
			</p>
			<a class="mt-4 inline-block font-medium text-[#ff5b3e] hover:underline" href="/login">Sign in</a>
		{/if}
	</div>
</div>
