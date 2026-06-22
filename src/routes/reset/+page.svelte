<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, ApiError } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { resetSchema, fieldErrors } from '$lib/schemas';

	const token = $derived(page.url.searchParams.get('token') ?? '');
	let pw = $state('');
	let confirm = $state('');
	let errors = $state<Record<string, string>>({});

	const reset = createMutation(() => ({
		mutationFn: () => api.resetPassword(token, pw),
		onSuccess: () => {
			toast.success('Password updated — please sign in.');
			goto('/login');
		}
	}));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const r = resetSchema.safeParse({ password: pw, confirm });
		if (!r.success) {
			errors = fieldErrors(r.error);
			return;
		}
		errors = {};
		reset.mutate();
	}
</script>

<svelte:head><title>Set new password · Livestreams</title></svelte:head>

<AuthShell>
	<div class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight">Set a new password</h1>
		<p class="mt-1.5 text-sm text-[var(--color-muted)]">Choose a strong password you'll remember.</p>
	</div>

	{#if !token}
		<div class="card p-6 text-sm text-red-500">
			This reset link is missing its token. Request a new one.
		</div>
	{:else}
		<form class="space-y-4" onsubmit={submit} novalidate>
			<div>
				<label class="label" for="pw">New password</label>
				<input id="pw" class="input" type="password" bind:value={pw} />
				{#if errors.password}<p class="mt-1 text-xs text-red-500">{errors.password}</p>{/if}
			</div>
			<div>
				<label class="label" for="confirm">Confirm password</label>
				<input id="confirm" class="input" type="password" bind:value={confirm} />
				{#if errors.confirm}<p class="mt-1 text-xs text-red-500">{errors.confirm}</p>{/if}
			</div>
			{#if reset.isError}
				<p class="text-sm text-red-500">{(reset.error as ApiError)?.message ?? 'Reset failed'}</p>
			{/if}
			<button class="btn-primary w-full" type="submit" disabled={reset.isPending}>
				{reset.isPending ? 'Updating…' : 'Update password'}
			</button>
		</form>
	{/if}

	<p class="mt-6 text-sm text-[var(--color-muted)]">
		<a class="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)]" href="/login"
			>Back to sign in</a
		>
	</p>
</AuthShell>
