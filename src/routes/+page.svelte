<script lang="ts">
	import { auth } from '$lib/auth.svelte';
	import {
		Radio,
		Video,
		Share2,
		Captions,
		MessagesSquare,
		ShieldCheck,
		BarChart3,
		Webhook,
		Film,
		Server,
		Sparkles,
		BadgeCheck,
		ArrowRight,
		MonitorPlay,
		KeyRound
	} from '@lucide/svelte';

	const cta = $derived(auth.isAuthenticated ? '/dashboard' : '/register');
	const ctaLabel = $derived(auth.isAuthenticated ? 'Open dashboard' : 'Start free');

	const features = [
		{
			icon: Video,
			title: 'Go live from the browser',
			body: 'Stream your camera or screen with one click — WebRTC ingest, no OBS required.'
		},
		{
			icon: Radio,
			title: 'Pro encoder ingest',
			body: 'RTMP & SRT in, adaptive HLS out. Point OBS, vMix or any encoder at your stream.'
		},
		{
			icon: Share2,
			title: 'Multistream everywhere',
			body: 'Relay to YouTube, Twitch & any RTMP target at once. Connect accounts, auto-import keys.'
		},
		{
			icon: Film,
			title: 'Recording & VOD',
			body: 'Every stream recorded to your storage. Upload videos, cut clips, transcode to HLS.'
		},
		{
			icon: Captions,
			title: 'AI captions',
			body: 'Auto-transcribe to subtitles with any provider you like — OpenAI-compatible or local.'
		},
		{
			icon: MessagesSquare,
			title: 'Unified live chat',
			body: 'YouTube + Twitch chat in one inbox, and reply to every platform from one place.'
		},
		{
			icon: ShieldCheck,
			title: 'Secure delivery',
			body: 'Signed, expiring, domain-locked playback links. Make any stream or video private.'
		},
		{
			icon: BarChart3,
			title: 'Analytics & QoS',
			body: 'Concurrent viewers, startup time, rebuffering and bitrate — know how playback feels.'
		},
		{
			icon: Webhook,
			title: 'Webhooks & API',
			body: 'Signed event webhooks and API keys to wire streaming into the rest of your stack.'
		}
	];

	// bento spans (lg, 4-col grid): varied widths, equal height/prominence so
	// every feature reads as important (one wide + two narrow per row).
	const spans = [
		'col-span-2', // 0
		'', // 1
		'', // 2
		'', // 3
		'', // 4
		'col-span-2', // 5
		'', // 6
		'col-span-2', // 7
		'' // 8
	];

	const steps = [
		{ n: '1', title: 'Create a stream', body: 'Pick webcam or encoder. Get an ingest URL, key, and a player instantly.' },
		{ n: '2', title: 'Go live', body: 'Publish from the browser or your encoder. Adaptive HLS, recording and multistream kick in automatically.' },
		{ n: '3', title: 'Share & grow', body: 'Embed the player, share secure links, watch analytics, and reach every platform at once.' }
	];
</script>

<svelte:head>
	<title>Livestreams — all-in-one live & video platform</title>
	<meta
		name="description"
		content="The all-in-one live streaming and video platform: browser go-live, multistream, recording, AI captions, live chat, secure delivery, analytics and an API."
	/>
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)]">
	<!-- Nav -->
	<header class="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 sm:px-8">
			<a href="/" class="flex items-center gap-2.5">
				<div
					class="squircle flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white"
					style="box-shadow: var(--shadow-accent)"
				>
					L
				</div>
				<span class="text-lg font-semibold tracking-tight">Livestreams</span>
			</a>
			<div class="flex-1"></div>
			<a
				href="#features"
				class="hidden text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] sm:block"
				>Features</a
			>
			{#if auth.isAuthenticated}
				<a href="/dashboard" class="btn-primary px-5 py-2.5 text-sm">Dashboard</a>
			{:else}
				<a
					href="/login"
					class="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
					>Sign in</a
				>
				<a href="/register" class="btn-primary px-5 py-2.5 text-sm">Get started</a>
			{/if}
		</div>
	</header>

	<!-- Hero -->
	<section class="mx-auto max-w-6xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-28">
		<h1 class="mx-auto max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl">
			The all-in-one live
			<span class="relative whitespace-nowrap">
				streaming &amp; video
				<svg
					aria-hidden="true"
					viewBox="0 0 320 14"
					preserveAspectRatio="none"
					class="absolute -bottom-2 left-0 h-3 w-full text-[var(--color-accent)]"
				>
					<path
						d="M3 9 C 80 3, 150 3, 220 6 S 300 9, 317 5"
						fill="none"
						stroke="currentColor"
						stroke-width="4"
						stroke-linecap="round"
					/>
				</svg>
			</span>
			platform
		</h1>
		<p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
			Go live from the browser or any encoder, multistream everywhere, record, caption, secure and
			analyze — all from one platform. No infrastructure to manage.
		</p>
		<div class="mt-8 flex items-center justify-center gap-3">
			<a href={cta} class="btn-primary px-6 py-3 text-base">
				{ctaLabel} <ArrowRight size={18} />
			</a>
			<a href="#features" class="btn-ghost px-6 py-3 text-base">See features</a>
		</div>
		<p class="mt-4 text-xs text-[var(--color-muted)]">No credit card · generous free tier</p>

		<!-- product glimpse -->
		<div class="mx-auto mt-14 max-w-4xl">
			<div class="card squircle overflow-hidden p-2">
				<div
					class="squircle relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent-2)] to-[var(--color-accent)]"
				>
					<div class="absolute left-4 top-4 flex items-center gap-1.5 text-xs font-medium text-white">
						<span class="relative flex h-2 w-2">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
						</span>
						LIVE
					</div>
					<MonitorPlay size={64} class="text-white/80" />
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section id="features" class="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to broadcast</h2>
			<p class="mt-3 text-[var(--color-muted)]">
				One platform for ingest, delivery, engagement and monetization.
			</p>
		</div>
		<div class="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:auto-rows-[200px]">
			{#each features as f, i (f.title)}
				{@const Icon = f.icon}
				<div class="card flex flex-col p-6 {spans[i]}">
					<div
						class="squircle flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
					>
						<Icon size={20} />
					</div>
					<div class="mt-auto pt-4">
						<h3 class="font-semibold">{f.title}</h3>
						<p class="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{f.body}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- How it works -->
	<section class="mx-auto max-w-6xl px-5 py-16 sm:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Live in three steps</h2>
		</div>
		<div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each steps as s (s.n)}
				<div class="card p-6">
					<div
						class="squircle flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white"
					>
						{s.n}
					</div>
					<h3 class="mt-4 font-semibold">{s.title}</h3>
					<p class="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{s.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Managed -->
	<section class="mx-auto max-w-6xl px-5 py-16 sm:px-8">
		<div class="card grid grid-cols-1 items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
			<div>
				<div
					class="squircle inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
				>
					<Server size={20} />
				</div>
				<h2 class="mt-4 text-3xl font-semibold tracking-tight">Fully managed, scales with you</h2>
				<p class="mt-3 text-[var(--color-muted)]">
					No servers to run, no media stack to babysit. We handle ingest, transcoding, storage and
					delivery — you just go live. Start free and upgrade as you grow.
				</p>
			</div>
			<ul class="grid gap-3">
				{#each ['Managed ingest, transcoding & global delivery', 'Connect YouTube, Twitch & your AI provider', 'Signed, expiring, domain-locked delivery', 'Teams, roles & organizations built in', 'Open REST API, webhooks & embeddable player'] as point (point)}
					<li class="flex items-start gap-3">
						<BadgeCheck size={20} class="mt-0.5 shrink-0 text-[var(--color-accent)]" />
						<span class="text-sm">{point}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="mx-auto max-w-6xl px-5 pb-20 pt-4 sm:px-8">
		<div
			class="squircle relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--color-accent-2)] to-[var(--color-accent)] p-10 text-center text-white sm:p-16"
			style="box-shadow: var(--shadow-accent)"
		>
			<div class="squircle absolute -right-12 -top-12 h-48 w-48 rounded-[40px] bg-white/10"></div>
			<h2 class="relative text-3xl font-semibold tracking-tight sm:text-4xl">
				Start broadcasting today
			</h2>
			<p class="relative mx-auto mt-3 max-w-md text-white/85">
				Spin up your first stream in minutes — webcam or encoder, your call.
			</p>
			<a
				href={cta}
				class="squircle relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[var(--color-accent)] transition-opacity hover:opacity-90"
			>
				{ctaLabel} <ArrowRight size={18} />
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-[var(--color-border)]">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-[var(--color-muted)] sm:flex-row sm:px-8"
		>
			<div class="flex items-center gap-2">
				<KeyRound size={14} />
				<span>Livestreams — live &amp; video platform</span>
			</div>
			<div class="flex gap-5">
				<a href="/login" class="hover:text-[var(--color-text)]">Sign in</a>
				<a href="/register" class="hover:text-[var(--color-text)]">Get started</a>
			</div>
		</div>
	</footer>
</div>
