<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';

	$effect(() => {
		goto(auth.isAuthenticated ? '/dashboard' : '/login', { replaceState: true });
	});
</script>

<div class="flex min-h-screen items-center justify-center text-[var(--color-muted)]">Loading…</div>
