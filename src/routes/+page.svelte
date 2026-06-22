<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { reveal } from '$lib/actions/reveal';
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
		MonitorPlay
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

	let active = $state(0); // selected feature in the interactive showcase

	// Pricing tiers (placeholder prices — edit to taste).
	const tiers = [
		{
			name: 'Free',
			price: '$0',
			period: '/mo',
			tagline: 'Get started',
			featured: false,
			features: ['1 live stream', 'Browser go-live & RTMP', 'Recording & VOD', '1 multistream target', 'Community support']
		},
		{
			name: 'Pro',
			price: '$19',
			period: '/mo',
			tagline: 'For creators',
			featured: true,
			features: ['Unlimited streams', 'Multistream everywhere', 'AI captions', 'Analytics & QoS', 'Secure links', '5 team members']
		},
		{
			name: 'Business',
			price: '$99',
			period: '/mo',
			tagline: 'For teams',
			featured: false,
			features: ['Everything in Pro', 'Domain-locked delivery', 'Webhooks & full API', 'Unlimited team & orgs', 'Priority support']
		}
	];

	const steps = [
		{ n: '1', title: 'Create a stream', body: 'Pick webcam or encoder. Get an ingest URL, key, and a player instantly.' },
		{ n: '2', title: 'Go live', body: 'Publish from the browser or your encoder. Adaptive HLS, recording and multistream kick in automatically.' },
		{ n: '3', title: 'Share & grow', body: 'Embed the player, share secure links, watch analytics, and reach every platform at once.' }
	];

	const managed = [
		'Managed ingest, transcoding & global delivery',
		'Recording, VOD & clips included',
		'Connect YouTube, Twitch & your AI provider',
		'Signed, expiring, domain-locked delivery',
		'Teams, roles & organizations built in',
		'Open REST API, webhooks & embeddable player'
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
			<a
				href="#pricing"
				class="hidden text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] sm:block"
				>Pricing</a
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
		<h1
			in:fly={{ y: 18, duration: 500 }}
			class="mx-auto max-w-3xl text-4xl font-semibold leading-[1.18] tracking-tight sm:text-6xl"
		>
			The all-in-one live
			<span class="relative whitespace-nowrap">
				streaming
				<svg
					aria-hidden="true"
					viewBox="0 0 120 12"
					preserveAspectRatio="none"
					class="absolute -bottom-1.5 left-0 h-2.5 w-full text-[var(--color-accent)]"
				>
					<path d="M2 8 C 35 3, 85 3, 118 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
				</svg>
			</span>
			&amp;
			<span class="relative whitespace-nowrap">
				video
				<svg
					aria-hidden="true"
					viewBox="0 0 80 12"
					preserveAspectRatio="none"
					class="absolute -bottom-1.5 left-0 h-2.5 w-full text-[var(--color-accent)]"
				>
					<path d="M2 7 C 25 3, 55 3, 78 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
				</svg>
			</span>
			platform
		</h1>
		<p
			in:fly={{ y: 18, duration: 500, delay: 90 }}
			class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]"
		>
			Go live from the browser or any encoder, multistream everywhere, record, caption, secure and
			analyze — all from one platform. No infrastructure to manage.
		</p>
		<div in:fly={{ y: 18, duration: 500, delay: 180 }} class="mt-8 flex items-center justify-center gap-3">
			<a href={cta} class="btn-primary px-6 py-3 text-base">
				{ctaLabel} <ArrowRight size={18} />
			</a>
			<a href="#features" class="btn-ghost px-6 py-3 text-base">See features</a>
		</div>
		<p class="mt-4 text-xs text-[var(--color-muted)]">No credit card · generous free tier</p>

		<!-- product glimpse -->
		<div in:fly={{ y: 24, duration: 600, delay: 260 }} class="mx-auto mt-14 max-w-4xl">
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
		<div class="mx-auto max-w-2xl text-center" use:reveal>
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to broadcast</h2>
			<p class="mt-3 text-[var(--color-muted)]">
				One platform for ingest, delivery, engagement and monetization.
			</p>
		</div>
		<div
			use:reveal={{ delay: 80 }}
			class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
		>
			<!-- feature list -->
			<div class="flex flex-col gap-1.5">
				{#each features as f, i (f.title)}
					{@const Icon = f.icon}
					{@const on = active === i}
					<button
						class="squircle flex items-start gap-3 rounded-2xl px-4 py-3 text-left transition-all {on
							? 'bg-[var(--color-surface)]'
							: 'hover:bg-[var(--color-surface)]/60'}"
						style={on ? 'box-shadow: var(--shadow-card)' : ''}
						onclick={() => (active = i)}
						onpointerenter={() => (active = i)}
					>
						<span
							class="squircle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors {on
								? 'bg-[var(--color-accent)] text-white'
								: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'}"
						>
							<Icon size={18} />
						</span>
						<div class="min-w-0">
							<p class="font-medium">{f.title}</p>
							{#if on}
								<p class="mt-0.5 text-sm leading-relaxed text-[var(--color-muted)]">{f.body}</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- preview pane -->
			<div class="card squircle p-2.5">
				{#key active}
					<div
						in:fade={{ duration: 180 }}
						class="squircle relative aspect-video overflow-hidden rounded-2xl bg-[var(--color-surface-2)] p-5"
					>
						{#if active === 0}
							<!-- browser go-live -->
							<div class="flex h-full w-full items-center justify-center rounded-xl bg-[#0e0f13]">
								<span class="absolute left-4 top-4 flex items-center gap-1.5 text-xs font-medium text-white">
									<span class="h-2 w-2 rounded-full bg-red-500"></span> LIVE
								</span>
								<Video size={48} class="text-white/40" />
								<div class="absolute inset-x-4 bottom-4 flex items-center gap-2">
									<span class="h-7 w-7 rounded-lg bg-white/10"></span>
									<span class="h-7 w-7 rounded-lg bg-white/10"></span>
									<span class="flex-1"></span>
									<span class="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">Go live</span>
								</div>
							</div>
						{:else if active === 1}
							<!-- encoder ingest -->
							<div class="flex h-full flex-col justify-center gap-3">
								<p class="text-xs font-medium text-[var(--color-muted)]">RTMP server</p>
								<div class="rounded-lg bg-[var(--color-surface)] px-3 py-2 font-mono text-xs">rtmp://ingest.live/app</div>
								<p class="text-xs font-medium text-[var(--color-muted)]">Stream key</p>
								<div class="rounded-lg bg-[var(--color-surface)] px-3 py-2 font-mono text-xs">sk_live_•••••••••••••••</div>
							</div>
						{:else if active === 2}
							<!-- multistream -->
							<div class="flex h-full flex-col justify-center gap-2.5">
								{#each ['YouTube', 'Twitch', 'Facebook', 'Kick'] as p (p)}
									<div class="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
										<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
										<span class="font-medium">{p}</span>
										<span class="ml-auto text-xs text-[var(--color-muted)]">streaming</span>
									</div>
								{/each}
							</div>
						{:else if active === 3}
							<!-- recording / VOD -->
							<div class="grid h-full grid-cols-3 grid-rows-2 gap-2">
								{#each Array(6) as _, k (k)}
									<div class="flex items-end rounded-lg bg-[var(--color-surface)] p-1.5">
										<span class="rounded bg-[var(--color-accent)]/15 px-1 text-[9px] font-mono text-[var(--color-accent)]">12:0{k}</span>
									</div>
								{/each}
							</div>
						{:else if active === 4}
							<!-- AI captions -->
							<div class="relative flex h-full items-center justify-center rounded-xl bg-[#0e0f13]">
								<Captions size={40} class="text-white/30" />
								<div class="absolute inset-x-6 bottom-6 rounded-md bg-black/70 px-3 py-1.5 text-center text-sm text-white">
									Welcome to today's stream
								</div>
							</div>
						{:else if active === 5}
							<!-- live chat -->
							<div class="flex h-full flex-col justify-center gap-2">
								{#each [['#f00', 'nova', 'this looks great 🔥'], ['#9146ff', 'kai', 'gg'], ['#f00', 'mei', 'where are you based?']] as [c, who, msg] (who)}
									<div class="flex items-start gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
										<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" style="background:{c}"></span>
										<span><span class="font-medium">{who}</span> <span class="text-[var(--color-muted)]">{msg}</span></span>
									</div>
								{/each}
							</div>
						{:else if active === 6}
							<!-- secure delivery -->
							<div class="flex h-full flex-col items-center justify-center gap-3 text-center">
								<span class="squircle flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]"><ShieldCheck size={24} /></span>
								<div class="rounded-lg bg-[var(--color-surface)] px-3 py-2 font-mono text-xs">…/index.m3u8?t=••• · expires 6h</div>
							</div>
						{:else if active === 7}
							<!-- analytics -->
							<div class="flex h-full flex-col justify-center gap-4">
								<div class="grid grid-cols-3 gap-3">
									{#each [['Viewers', '1,284'], ['Startup', '0.8s'], ['Rebuffer', '0.1%']] as [l, v] (l)}
										<div class="rounded-lg bg-[var(--color-surface)] p-2.5">
											<p class="text-[10px] text-[var(--color-muted)]">{l}</p>
											<p class="text-sm font-semibold tabular-nums">{v}</p>
										</div>
									{/each}
								</div>
								<div class="flex items-end gap-1.5">
									{#each [40, 55, 48, 70, 62, 85, 78, 96] as h (h)}
										<div class="flex-1 rounded-t bg-[var(--color-accent)]/60" style="height:{h * 0.5}px"></div>
									{/each}
								</div>
							</div>
						{:else}
							<!-- webhooks / API -->
							<div class="flex h-full items-center">
								<pre class="w-full overflow-hidden rounded-lg bg-[#0e0f13] p-4 font-mono text-[11px] leading-relaxed text-white/80"><span class="text-emerald-400">POST</span> /your/webhook
{`{`}
  "event": <span class="text-[var(--color-accent-2)]">"stream.online"</span>,
  "stream": <span class="text-[var(--color-accent-2)]">"main"</span>
{`}`}</pre>
							</div>
						{/if}
					</div>
				{/key}
			</div>
		</div>
	</section>

	<!-- How it works — connected stepper -->
	<section class="mx-auto max-w-5xl px-5 py-16 sm:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Live in three steps</h2>
		</div>
		<div use:reveal class="relative mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
			<!-- connecting line (desktop) -->
			<div
				class="absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-[var(--color-accent)]/40 via-[var(--color-accent)]/40 to-[var(--color-accent)]/40 md:block"
			></div>
			{#each steps as s (s.n)}
				<div class="relative text-center">
					<div
						class="squircle relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-xl font-bold text-white"
						style="box-shadow: var(--shadow-accent)"
					>
						{s.n}
					</div>
					<h3 class="mt-5 text-lg font-semibold">{s.title}</h3>
					<p class="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
						{s.body}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Managed — tinted highlight band with benefit cards -->
	<section class="mx-auto max-w-6xl px-5 py-16 sm:px-8">
		<div use:reveal class="squircle rounded-[28px] bg-[var(--color-accent)]/[0.06] p-8 sm:p-14">
			<div class="mx-auto max-w-2xl text-center">
				<span
					class="squircle inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white"
					style="box-shadow: var(--shadow-accent)"
				>
					<Server size={22} />
				</span>
				<h2 class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
					Fully managed, scales with you
				</h2>
				<p class="mt-3 text-[var(--color-muted)]">
					No servers to run, no media stack to babysit. We handle ingest, transcoding, storage and
					delivery — you just go live. Start free and upgrade as you grow.
				</p>
			</div>
			<div class="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each managed as point (point)}
					<div class="card squircle flex items-center gap-3 p-4">
						<BadgeCheck size={20} class="shrink-0 text-[var(--color-accent)]" />
						<span class="text-sm font-medium">{point}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Pricing -->
	<section id="pricing" class="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8">
		<div class="mx-auto max-w-2xl text-center" use:reveal>
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, scalable pricing</h2>
			<p class="mt-3 text-[var(--color-muted)]">Start free. Upgrade when you grow. Cancel anytime.</p>
		</div>
		<div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each tiers as t, i (t.name)}
				<div
					use:reveal={{ delay: i * 90 }}
					class="card relative flex flex-col p-6 {t.featured
						? 'ring-2 ring-[var(--color-accent)]'
						: ''}"
				>
					{#if t.featured}
						<span
							class="squircle absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-0.5 text-xs font-semibold text-white"
						>
							Most popular
						</span>
					{/if}
					<p class="text-sm font-medium text-[var(--color-muted)]">{t.name}</p>
					<p class="mt-1 text-xs text-[var(--color-muted)]">{t.tagline}</p>
					<p class="mt-4 flex items-end gap-1">
						<span class="text-4xl font-semibold tracking-tight">{t.price}</span>
						<span class="pb-1 text-sm text-[var(--color-muted)]">{t.period}</span>
					</p>
					<ul class="mt-6 flex-1 space-y-2.5">
						{#each t.features as f (f)}
							<li class="flex items-start gap-2.5 text-sm">
								<BadgeCheck size={18} class="mt-px shrink-0 text-[var(--color-accent)]" />
								{f}
							</li>
						{/each}
					</ul>
					<a
						href={cta}
						class="mt-7 w-full {t.featured ? 'btn-primary' : 'btn-ghost'}"
					>
						{t.name === 'Free' ? 'Start free' : `Choose ${t.name}`}
					</a>
				</div>
			{/each}
		</div>
		<p class="mt-4 text-center text-xs text-[var(--color-muted)]">
			Prices shown are placeholders — set your own tiers anytime.
		</p>
	</section>

	<!-- Final CTA -->
	<section class="mx-auto max-w-6xl px-5 pb-20 pt-4 sm:px-8">
		<div
			use:reveal
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
				<span
					class="squircle flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[11px] font-bold text-white"
					>L</span
				>
				<span>Livestreams — live &amp; video platform</span>
			</div>
			<div class="flex gap-5">
				<a href="/login" class="hover:text-[var(--color-text)]">Sign in</a>
				<a href="/register" class="hover:text-[var(--color-text)]">Get started</a>
			</div>
		</div>
	</footer>
</div>
