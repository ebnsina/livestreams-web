<script lang="ts">
	import { createMutation } from '@tanstack/svelte-query';
	import { api } from '$lib/api';

	let email = $state('');
	let sent = $state(false);

	const forgot = createMutation(() => ({
		mutationFn: () => api.forgotPassword(email),
		onSuccess: () => (sent = true)
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		forgot.mutate();
	}
</script>

<svelte:head><title>Reset password · Livestreams</title></svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5b3e] text-lg font-bold text-white"
			>
				L
			</div>
			<h1 class="text-xl font-semibold">Reset your password</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				We'll email you a link to set a new password.
			</p>
		</div>

		{#if sent}
			<div class="card p-6 text-center text-sm">
				<p class="font-medium">Check your email</p>
				<p class="mt-1 text-[var(--color-muted)]">
					If an account exists for <span class="font-medium">{email}</span>, a reset link is on its
					way. The link expires in 1 hour.
				</p>
			</div>
		{:else}
			<form class="card space-y-4 p-6" onsubmit={submit}>
				<div>
					<label class="label" for="email">Email</label>
					<input id="email" class="input" type="email" bind:value={email} required />
				</div>
				<button class="btn-primary w-full" type="submit" disabled={forgot.isPending}>
					{forgot.isPending ? 'Sending…' : 'Send reset link'}
				</button>
			</form>
		{/if}

		<p class="mt-6 text-center text-sm text-[var(--color-muted)]">
			<a class="font-medium text-[#ff5b3e] hover:text-[#ff7a63]" href="/login">Back to sign in</a>
		</p>
	</div>
</div>
