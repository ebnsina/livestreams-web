<script lang="ts">
	import { goto } from '$app/navigation';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { auth } from '$lib/auth.svelte';

	let name = $state('');
	let orgName = $state('');
	let email = $state('');
	let password = $state('');

	const register = createMutation(() => ({
		mutationFn: () => api.register({ email, password, name, org_name: orgName }),
		onSuccess: (res) => {
			auth.set(res.access_token, res.refresh_token, res.user);
			goto('/dashboard');
		}
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		register.mutate();
	}
</script>

<svelte:head><title>Create account · Livestreams</title></svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-10">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5b3e] text-lg font-bold text-white"
			>
				L
			</div>
			<h1 class="text-xl font-semibold">Create your account</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">Start streaming in minutes</p>
		</div>

		<form class="card space-y-4 p-6" onsubmit={submit}>
			<div>
				<label class="label" for="name">Your name</label>
				<input id="name" class="input" bind:value={name} required />
			</div>
			<div>
				<label class="label" for="org">Organization</label>
				<input id="org" class="input" bind:value={orgName} required />
			</div>
			<div>
				<label class="label" for="email">Email</label>
				<input id="email" class="input" type="email" bind:value={email} required />
			</div>
			<div>
				<label class="label" for="password">Password</label>
				<input
					id="password"
					class="input"
					type="password"
					bind:value={password}
					minlength="8"
					required
				/>
			</div>

			{#if register.isError}
				<p class="text-sm text-red-400">
					{(register.error as ApiError)?.message ?? 'Registration failed'}
				</p>
			{/if}

			<button class="btn-primary w-full" type="submit" disabled={register.isPending}>
				{register.isPending ? 'Creating…' : 'Create account'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-[var(--color-muted)]">
			Already have an account?
			<a class="font-medium text-[#ff5b3e] hover:text-[#ff7a63]" href="/login">Sign in</a>
		</p>
	</div>
</div>
