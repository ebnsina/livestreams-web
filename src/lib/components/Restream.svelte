<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';

	let { streamId }: { streamId: string } = $props();
	const qc = useQueryClient();

	const dests = createQuery(() => ({
		queryKey: keys.streamDestinations(streamId),
		queryFn: () => api.streamDestinations(streamId),
		refetchInterval: 5000
	}));
	const list = $derived(dests.data?.data ?? []);

	const presets: Record<string, string> = {
		youtube: 'rtmp://a.rtmp.youtube.com/live2',
		twitch: 'rtmp://live.twitch.tv/app',
		facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
		custom: ''
	};

	let showForm = $state(false);
	let platform = $state('youtube');
	let name = $state('');
	let url = $state(presets.youtube);
	let streamKey = $state('');

	$effect(() => {
		// keep url in sync with the chosen preset (custom keeps whatever is typed)
		if (platform !== 'custom') url = presets[platform];
	});

	const toggle = createMutation(() => ({
		mutationFn: (v: { destId: string; enabled: boolean }) =>
			api.toggleStreamDestination(streamId, v.destId, v.enabled),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.streamDestinations(streamId) })
	}));

	const add = createMutation(() => ({
		mutationFn: async () => {
			const d = await api.createDestination({ platform, name, url, stream_key: streamKey });
			await api.toggleStreamDestination(streamId, d.id, true);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.streamDestinations(streamId) });
			showForm = false;
			name = '';
			streamKey = '';
		}
	}));

	const platformLabel: Record<string, string> = {
		youtube: 'YouTube',
		twitch: 'Twitch',
		facebook: 'Facebook',
		kick: 'Kick',
		custom: 'Custom'
	};
</script>

<section class="card overflow-hidden">
	<div class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
		<span class="text-[13px] font-semibold tracking-[-0.01em]">Multistream</span>
		<button class="btn-ghost text-xs" onclick={() => (showForm = !showForm)}>
			{showForm ? 'Cancel' : '+ Destination'}
		</button>
	</div>

	{#if showForm}
		<form
			class="space-y-3 border-b border-[var(--color-border)] p-5"
			onsubmit={(e) => {
				e.preventDefault();
				add.mutate();
			}}
		>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="label" for="plat">Platform</label>
					<select id="plat" class="input" bind:value={platform}>
						<option value="youtube">YouTube</option>
						<option value="twitch">Twitch</option>
						<option value="facebook">Facebook</option>
						<option value="kick">Kick</option>
						<option value="custom">Custom RTMP</option>
					</select>
				</div>
				<div>
					<label class="label" for="dname">Name</label>
					<input id="dname" class="input" bind:value={name} placeholder="My channel" required />
				</div>
			</div>
			<div>
				<label class="label" for="durl">RTMP/RTMPS URL</label>
				<input
					id="durl"
					class="input font-mono text-xs"
					bind:value={url}
					placeholder="rtmp://…"
					required
				/>
			</div>
			<div>
				<label class="label" for="dkey">Stream key</label>
				<input id="dkey" class="input font-mono text-xs" bind:value={streamKey} required />
			</div>
			{#if add.isError}<p class="text-sm text-red-500">Could not add destination</p>{/if}
			<button class="btn-primary w-full" type="submit" disabled={add.isPending}>
				{add.isPending ? 'Adding…' : 'Add & enable'}
			</button>
		</form>
	{/if}

	{#if list.length === 0}
		<div class="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
			No destinations. Add one to restream live to YouTube, Twitch, and more.
		</div>
	{:else}
		<ul class="divide-y divide-[var(--color-border)]">
			{#each list as d (d.id)}
				<li class="flex items-center justify-between gap-3 px-5 py-3">
					<div class="min-w-0">
						<p class="flex items-center gap-2 truncate text-sm font-medium">
							{d.name}
							{#if d.relay_state === 'relaying'}
								<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
									<span class="relative flex h-1.5 w-1.5">
										<span
											class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"
										></span>
										<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
									</span>
									live
								</span>
							{:else if d.relay_state === 'error'}
								<span class="text-[11px] font-medium text-red-500">error</span>
							{/if}
						</p>
						<p class="font-mono text-[11px] text-[var(--color-muted)]">
							{platformLabel[d.platform] ?? d.platform}
						</p>
					</div>
					<button
						class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors {d.enabled
							? 'bg-violet-600'
							: 'bg-[var(--color-border)]'}"
						onclick={() => toggle.mutate({ destId: d.id, enabled: !d.enabled })}
						disabled={toggle.isPending}
						aria-label="Toggle {d.name}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {d.enabled
								? 'translate-x-4'
								: 'translate-x-0.5'}"
						></span>
					</button>
				</li>
			{/each}
		</ul>
		<p class="px-5 pb-3 pt-1 text-[11px] text-[var(--color-muted)]">
			Toggling while live starts/stops that destination immediately.
		</p>
	{/if}
</section>
