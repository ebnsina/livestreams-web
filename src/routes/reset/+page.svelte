<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { toast } from '$lib/toast.svelte';

	const token = $derived(page.url.searchParams.get('token') ?? '');
	let pw = $state('');
	let confirm = $state('');

	const reset = createMutation(() => ({
		mutationFn: () => api.resetPassword(token, pw),
		onSuccess: () => {
			toast.success('Password updated — please sign in.');
			goto('/login');
		}
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (pw !== confirm) return;
		reset.mutate();
	}
</script>

<svelte:head><title>Set new password · Livestreams</title></svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5b3e] text-lg font-bold text-white"
			>
				L
			</div>
			<h1 class="text-xl font-semibold">Set a new password</h1>
		</div>

		{#if !token}
			<div class="card p-6 text-center text-sm text-red-500">
				This reset link is missing its token. Request a new one.
			</div>
		{:else}
			<form class="card space-y-4 p-6" onsubmit={submit}>
				<div>
					<label class="label" for="pw">New password</label>
					<input id="pw" class="input" type="password" bind:value={pw} minlength="8" required />
				</div>
				<div>
					<label class="label" for="confirm">Confirm password</label>
					<input id="confirm" class="input" type="password" bind:value={confirm} required />
				</div>
				{#if pw && confirm && pw !== confirm}
					<p class="text-sm text-red-500">Passwords don't match</p>
				{/if}
				{#if reset.isError}
					<p class="text-sm text-red-500">{(reset.error as ApiError)?.message ?? 'Reset failed'}</p>
				{/if}
				<button class="btn-primary w-full" type="submit" disabled={reset.isPending}>
					{reset.isPending ? 'Updating…' : 'Update password'}
				</button>
			</form>
		{/if}

		<p class="mt-6 text-center text-sm text-[var(--color-muted)]">
			<a class="font-medium text-[#ff5b3e] hover:text-[#ff7a63]" href="/login">Back to sign in</a>
		</p>
	</div>
</div>
