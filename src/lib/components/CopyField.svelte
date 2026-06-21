<script lang="ts">
	let {
		label,
		value,
		secret = false
	}: { label: string; value: string; secret?: boolean } = $props();

	let copied = $state(false);
	let userRevealed = $state(false);
	const revealed = $derived(!secret || userRevealed);

	async function copy() {
		await navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="min-w-0">
	<span class="label">{label}</span>
	<div class="flex items-stretch gap-2">
		<code
			class="min-w-0 flex-1 truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[var(--color-text)]"
		>
			{revealed ? value : '•'.repeat(Math.min(value.length, 32))}
		</code>
		{#if secret}
			<button
				class="btn-ghost shrink-0"
				onclick={() => (userRevealed = !userRevealed)}
				title="Toggle visibility"
			>
				{revealed ? 'Hide' : 'Show'}
			</button>
		{/if}
		<button class="btn-ghost shrink-0" onclick={copy}>
			{copied ? 'Copied!' : 'Copy'}
		</button>
	</div>
</div>
