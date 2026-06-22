<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { MessagesSquare, Send } from '@lucide/svelte';

	type ChatMessage = { platform: string; author: string; text: string; at: string };

	let messages = $state<ChatMessage[]>([]);
	let draft = $state('');
	let sending = $state(false);
	let connected = $state(false);
	let listEl = $state<HTMLDivElement>();

	const platformDot: Record<string, string> = {
		youtube: 'bg-red-500',
		twitch: 'bg-[#9146ff]'
	};

	onMount(() => {
		const es = new EventSource(api.chatStreamUrl());
		es.onopen = () => (connected = true);
		es.onerror = () => (connected = false);
		es.onmessage = (e) => {
			try {
				const m = JSON.parse(e.data) as ChatMessage;
				messages = [...messages.slice(-199), m];
				queueMicrotask(() => listEl?.scrollTo({ top: listEl.scrollHeight }));
			} catch {
				/* ignore keep-alives */
			}
		};
		return () => es.close();
	});

	async function send(e: SubmitEvent) {
		e.preventDefault();
		const text = draft.trim();
		if (!text || sending) return;
		sending = true;
		try {
			const { sent } = await api.sendChat(text);
			if (sent.length === 0) toast.error('No connected platform has an active chat');
			else draft = '';
		} catch {
			toast.error('Could not send message');
		} finally {
			sending = false;
		}
	}

	function ago(s: string) {
		const d = (Date.now() - new Date(s).getTime()) / 1000;
		if (d < 60) return 'now';
		if (d < 3600) return `${Math.floor(d / 60)}m`;
		return `${Math.floor(d / 3600)}h`;
	}
</script>

<div class="card flex h-[28rem] flex-col overflow-hidden">
	<div class="flex items-center justify-between px-5 py-3.5">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<MessagesSquare size={16} /> Live chat
		</h2>
		<span class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
			<span class="h-2 w-2 rounded-full {connected ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}"></span>
			{connected ? 'Connected' : 'Connecting…'}
		</span>
	</div>

	<div bind:this={listEl} class="flex-1 space-y-2.5 overflow-y-auto px-5 py-2">
		{#if messages.length === 0}
			<p class="py-10 text-center text-sm text-[var(--color-muted)]">
				Messages from your connected YouTube &amp; Twitch chats appear here while you're live.
			</p>
		{:else}
			{#each messages as m, i (i)}
				<div class="flex gap-2 text-sm">
					<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {platformDot[m.platform] ?? 'bg-[var(--color-muted)]'}"></span>
					<div class="min-w-0">
						<span class="font-medium">{m.author}</span>
						<span class="ml-1 text-[11px] text-[var(--color-muted)]">{ago(m.at)}</span>
						<p class="break-words text-[var(--color-text)]">{m.text}</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<form class="flex items-center gap-2 px-5 py-3" onsubmit={send}>
		<input
			class="input flex-1"
			placeholder="Reply to all platforms…"
			bind:value={draft}
			maxlength="450"
		/>
		<button class="btn-primary px-4 py-2.5" type="submit" disabled={sending || !draft.trim()}>
			<Send size={16} />
		</button>
	</form>
</div>
