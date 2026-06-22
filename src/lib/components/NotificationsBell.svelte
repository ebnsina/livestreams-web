<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { keys } from '$lib/query';
	import type { Notification } from '$lib/types';
	import { Bell, CheckCheck } from '@lucide/svelte';

	const qc = useQueryClient();
	let open = $state(false);
	let btn = $state<HTMLButtonElement>();
	let style = $state('');

	const notifs = createQuery(() => ({
		queryKey: keys.notifications,
		queryFn: () => api.notifications(),
		refetchInterval: 20000
	}));
	const list = $derived(notifs.data?.data ?? []);
	const unread = $derived(notifs.data?.unread ?? 0);

	const markAll = createMutation(() => ({
		mutationFn: () => api.markAllNotificationsRead(),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications })
	}));
	const markOne = createMutation(() => ({
		mutationFn: (id: string) => api.markNotificationRead(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications })
	}));

	function place() {
		if (!btn) return;
		const r = btn.getBoundingClientRect();
		const width = 320; // w-80
		const left = Math.max(8, Math.round(r.right - width)); // right-align to the bell
		style = `top:${Math.round(r.bottom + 8)}px; left:${left}px`;
	}
	function toggle(e: MouseEvent) {
		e.stopPropagation();
		if (!open) place();
		open = !open;
	}
	function onClick(n: Notification) {
		if (!n.read) markOne.mutate(n.id);
		open = false;
		if (n.stream_id) goto(`/streams/${n.stream_id}`);
	}

	$effect(() => {
		if (!open) return;
		const close = () => (open = false);
		const onDoc = (e: MouseEvent) => {
			if (btn && !btn.contains(e.target as Node)) open = false;
		};
		document.addEventListener('click', onDoc, true);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('click', onDoc, true);
			window.removeEventListener('resize', close);
		};
	});

	function ago(s: string) {
		const d = (Date.now() - new Date(s).getTime()) / 1000;
		if (d < 60) return 'just now';
		if (d < 3600) return `${Math.floor(d / 60)}m ago`;
		if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
		return `${Math.floor(d / 86400)}d ago`;
	}
</script>

<button
	bind:this={btn}
	class="relative rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
	aria-label="Notifications"
	onclick={toggle}
>
	<Bell size={18} />
	{#if unread > 0}
		<span
			class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white"
		>
			{unread > 9 ? '9+' : unread}
		</span>
	{/if}
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="squircle fixed z-50 max-h-[70vh] w-80 origin-top-right overflow-hidden rounded-2xl bg-[var(--color-surface)]"
		style="{style}; transform-origin: top right; box-shadow: var(--shadow-pop)"
		role="menu"
		tabindex="-1"
		transition:scale={{ start: 0.85, opacity: 0, duration: 160 }}
		onclick={(e) => e.stopPropagation()}
	>
		<div class="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
			<span class="text-[13px] font-semibold">Notifications</span>
			{#if unread > 0}
				<button
					class="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
					onclick={() => markAll.mutate()}
				>
					<CheckCheck size={13} /> Mark all read
				</button>
			{/if}
		</div>
		<div class="max-h-[60vh] overflow-y-auto">
			{#if list.length === 0}
				<p class="px-4 py-8 text-center text-sm text-[var(--color-muted)]">No notifications.</p>
			{:else}
				<ul class="divide-y divide-[var(--color-border)]">
					{#each list as n (n.id)}
						<li>
							<button
								class="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]"
								onclick={() => onClick(n)}
							>
								<span
									class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full {n.read
										? 'bg-transparent'
										: 'bg-[var(--color-accent)]'}"
								></span>
								<div class="min-w-0">
									<p class="text-sm font-medium {n.read ? 'text-[var(--color-muted)]' : ''}">
										{n.title}
									</p>
									{#if n.body}<p class="truncate text-xs text-[var(--color-muted)]">{n.body}</p>{/if}
									<p class="mt-0.5 text-[10px] text-[var(--color-muted)]">{ago(n.created_at)}</p>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}
