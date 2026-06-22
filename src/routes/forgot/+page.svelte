<script lang="ts">
	import { createMutation } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';

	let email = $state('');
	let sent = $state(false);

	const forgot = createMutation(() => ({
		mutationFn: () => api.forgotPassword(email),
		onSuccess: () => (sent = true),
		onError: () => toast.error('Could not send reset link — try again')
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		forgot.mutate();
	}
</script>

<svelte:head><title>Reset password · Livestreams</title></svelte:head>

<AuthShell>
	<div class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight">Reset your password</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">
			We'll email you a link to set a new password.
		</p>
	</div>

	{#if sent}
		<div class="card p-6 text-sm">
			<p class="font-medium">Check your email</p>
			<p class="mt-1 text-[var(--color-muted)]">
				If an account exists for <span class="font-medium">{email}</span>, a reset link is on its way.
				The link expires in 1 hour.
			</p>
		</div>
	{:else}
		<form class="space-y-4" onsubmit={submit}>
			<div>
				<label class="label" for="email">Email</label>
				<input id="email" class="input" type="email" bind:value={email} required />
			</div>
			<button class="btn-primary w-full" type="submit" disabled={forgot.isPending}>
				{forgot.isPending ? 'Sending…' : 'Send reset link'}
			</button>
		</form>
	{/if}

	<p class="mt-6 text-sm text-[var(--color-muted)]">
		<a class="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)]" href="/login"
			>Back to sign in</a
		>
	</p>
</AuthShell>
