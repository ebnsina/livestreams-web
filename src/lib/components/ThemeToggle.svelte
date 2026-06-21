<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import { theme } from '$lib/theme.svelte';
</script>

<button
	class="btn-ghost h-9 w-9 !px-0"
	onclick={() => theme.toggle()}
	title="Toggle theme"
	aria-label="Toggle light/dark theme"
>
	{#if theme.mode === 'dark'}
		<Sun size={16} />
	{:else}
		<Moon size={16} />
	{/if}
</button>
