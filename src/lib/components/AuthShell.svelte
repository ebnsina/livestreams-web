<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Radio, Film, Share2 } from '@lucide/svelte';

	let { children }: { children: Snippet } = $props();

	const features = [
		{ icon: Radio, text: 'Adaptive HLS ingest in seconds' },
		{ icon: Film, text: 'Automatic recording & transcoding' },
		{ icon: Share2, text: 'Multistream to YouTube, Twitch & more' }
	];
</script>

<div class="flex min-h-screen">
	<!-- Brand panel -->
	<div
		class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-accent-2)] to-[var(--color-accent)] p-12 text-white lg:flex"
	>
		<!-- decorative squircles -->
		<div
			class="squircle absolute -right-16 -top-16 h-64 w-64 rounded-[40px] bg-white/10"
			aria-hidden="true"
		></div>
		<div
			class="squircle absolute -bottom-24 -left-10 h-72 w-72 rounded-[48px] bg-black/10"
			aria-hidden="true"
		></div>

		<div class="relative flex items-center gap-2.5">
			<div
				class="squircle flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-base font-bold text-[var(--color-accent)]"
			>
				L
			</div>
			<span class="text-lg font-semibold">Livestreams</span>
		</div>

		<div class="relative max-w-sm">
			<h2 class="text-4xl font-semibold leading-tight tracking-tight">Go live, your way.</h2>
			<p class="mt-4 text-[15px] leading-relaxed text-white/80">
				Self-hosted live streaming with adaptive HLS, recording, and multistream — all under your
				control.
			</p>
			<ul class="mt-8 space-y-3.5">
				{#each features as f (f.text)}
					{@const Icon = f.icon}
					<li class="flex items-center gap-3 text-sm text-white/90">
						<span
							class="squircle flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15"
						>
							<Icon size={16} />
						</span>
						{f.text}
					</li>
				{/each}
			</ul>
		</div>

		<p class="relative text-xs text-white/60">© {new Date().getFullYear()} Livestreams</p>
	</div>

	<!-- Form panel -->
	<div class="flex flex-1 items-center justify-center px-5 py-10">
		<div class="w-full max-w-sm">
			<!-- mobile brand -->
			<a href="/" class="mb-8 flex items-center gap-2.5 lg:hidden">
				<div
					class="squircle flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-base font-bold text-white"
				>
					L
				</div>
				<span class="text-lg font-semibold">Livestreams</span>
			</a>
			{@render children()}
		</div>
	</div>
</div>
