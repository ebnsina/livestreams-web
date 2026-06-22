<script lang="ts">
	import { goto } from '$app/navigation';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { registerSchema, fieldErrors } from '$lib/schemas';

	let name = $state('');
	let orgName = $state('');
	let email = $state('');
	let password = $state('');
	let errors = $state<Record<string, string>>({});

	const register = createMutation(() => ({
		mutationFn: () => api.register({ email, password, name, org_name: orgName }),
		onSuccess: (res) => {
			auth.set(res.access_token, res.refresh_token, res.user);
			toast.success('Account created — check your email to verify');
			goto('/dashboard');
		},
		onError: (e) => toast.error((e as ApiError)?.message ?? 'Could not create account')
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const r = registerSchema.safeParse({ name, orgName, email, password });
		if (!r.success) {
			errors = fieldErrors(r.error);
			return;
		}
		errors = {};
		register.mutate();
	}
</script>

<svelte:head><title>Create account · Livestreams</title></svelte:head>

<AuthShell>
	<div class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight">Create your account</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">Start streaming in minutes</p>
	</div>

	<form class="space-y-4" onsubmit={submit} novalidate>
		<div>
			<label class="label" for="name">Your name</label>
			<input id="name" class="input" bind:value={name} />
			{#if errors.name}<p class="mt-1 text-xs text-red-500">{errors.name}</p>{/if}
		</div>
		<div>
			<label class="label" for="org">Organization</label>
			<input id="org" class="input" bind:value={orgName} />
			{#if errors.orgName}<p class="mt-1 text-xs text-red-500">{errors.orgName}</p>{/if}
		</div>
		<div>
			<label class="label" for="email">Email</label>
			<input id="email" class="input" type="email" bind:value={email} />
			{#if errors.email}<p class="mt-1 text-xs text-red-500">{errors.email}</p>{/if}
		</div>
		<div>
			<label class="label" for="password">Password</label>
			<input id="password" class="input" type="password" bind:value={password} />
			{#if errors.password}<p class="mt-1 text-xs text-red-500">{errors.password}</p>{/if}
		</div>

		{#if register.isError}
			<p class="text-sm text-red-500">
				{(register.error as ApiError)?.message ?? 'Registration failed'}
			</p>
		{/if}

		<button class="btn-primary w-full" type="submit" disabled={register.isPending}>
			{register.isPending ? 'Creating…' : 'Create account'}
		</button>
	</form>

	<p class="mt-6 text-sm text-[var(--color-muted)]">
		Already have an account?
		<a class="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)]" href="/login"
			>Sign in</a
		>
	</p>
</AuthShell>
