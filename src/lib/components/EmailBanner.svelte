<script lang="ts">
	import { createMutation } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import { MailWarning } from '@lucide/svelte';

	const resend = createMutation(() => ({
		mutationFn: () => api.resendVerification(),
		onSuccess: () => toast.success('Verification email sent'),
		onError: () => toast.error('Could not resend — try again')
	}));
</script>

{#if auth.user && auth.user.email_verified === false}
	<div
		class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm"
	>
		<span class="flex items-center gap-2 text-amber-700 dark:text-amber-400">
			<MailWarning size={16} />
			Please verify your email — we sent a link to {auth.user.email}.
		</span>
		<button
			class="font-medium text-amber-700 hover:underline disabled:opacity-50 dark:text-amber-400"
			onclick={() => resend.mutate()}
			disabled={resend.isPending}
		>
			{resend.isPending ? 'Sending…' : 'Resend'}
		</button>
	</div>
{/if}
