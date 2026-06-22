<script lang="ts">
	import { goto } from '$app/navigation';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';

	let email = $state('');
	let password = $state('');

	const login = createMutation(() => ({
		mutationFn: () => api.login({ email, password }),
		onSuccess: (res) => {
			auth.set(res.access_token, res.refresh_token, res.user);
			toast.success('Welcome back');
			goto('/dashboard');
		},
		onError: (e) => toast.error((e as ApiError)?.message ?? 'Login failed')
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		login.mutate();
	}
</script>

<svelte:head><title>Sign in · Livestreams</title></svelte:head>

<AuthShell>
	<div class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">Sign in to your dashboard</p>
	</div>

	<form class="space-y-4" onsubmit={submit}>
		<div>
			<label class="label" for="email">Email</label>
			<input id="email" class="input" type="email" bind:value={email} required />
		</div>
		<div>
			<div class="mb-1.5 flex items-center justify-between">
				<label class="label mb-0" for="password">Password</label>
				<a class="text-xs font-medium text-[var(--color-accent)] hover:underline" href="/forgot"
					>Forgot?</a
				>
			</div>
			<input id="password" class="input" type="password" bind:value={password} required />
		</div>

		{#if login.isError}
			<p class="text-sm text-red-500">
				{(login.error as ApiError)?.message ?? 'Login failed'}
			</p>
		{/if}

		<button class="btn-primary w-full" type="submit" disabled={login.isPending}>
			{login.isPending ? 'Signing in…' : 'Sign in'}
		</button>
	</form>

	<p class="mt-6 text-sm text-[var(--color-muted)]">
		No account?
		<a class="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)]" href="/register"
			>Create one</a
		>
	</p>
</AuthShell>
