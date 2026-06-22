<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/toast.svelte';
	import { auth } from '$lib/auth.svelte';
	import { Video, VideoOff, Mic, MicOff, MonitorUp, Radio, Loader2 } from '@lucide/svelte';

	let { whipUrl }: { whipUrl: string } = $props();

	let videoEl = $state<HTMLVideoElement>();
	let stream = $state<MediaStream | null>(null);
	let pc = $state<RTCPeerConnection | null>(null);
	let phase = $state<'idle' | 'preview' | 'connecting' | 'live'>('idle');
	let camOn = $state(true);
	let micOn = $state(true);
	let sharing = $state(false);

	// Robustly attach the stream to the <video> whenever either changes, and
	// force playback (autoplay can be flaky after a dynamic srcObject swap).
	$effect(() => {
		if (videoEl && stream) {
			videoEl.srcObject = stream;
			videoEl.play().catch(() => {});
		}
	});

	// Start the camera preview as soon as the studio opens.
	onMount(() => {
		startPreview(false);
	});

	async function startPreview(screen = false) {
		try {
			stopTracks();
			stream = screen
				? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
				: await navigator.mediaDevices.getUserMedia({
						video: { width: { ideal: 1280 }, height: { ideal: 720 } },
						audio: true
					});
			sharing = screen;
			camOn = true;
			micOn = true;
			if (phase === 'idle') phase = 'preview';
			// if we were already live, swap the outgoing tracks
			if (pc && phase === 'live') await replaceTracks();
		} catch (e) {
			toast.error((e as Error)?.message ?? 'Could not access camera/microphone');
		}
	}

	async function replaceTracks() {
		if (!pc || !stream) return;
		for (const sender of pc.getSenders()) {
			const kind = sender.track?.kind;
			const next = stream.getTracks().find((t: MediaStreamTrack) => t.kind === kind);
			if (next) await sender.replaceTrack(next);
		}
	}

	function toggleCam() {
		if (!stream) return;
		camOn = !camOn;
		stream.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = camOn));
	}
	function toggleMic() {
		if (!stream) return;
		micOn = !micOn;
		stream.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = micOn));
	}

	// WHIP: POST the local SDP offer, apply the SDP answer.
	async function goLive() {
		if (!stream) {
			await startPreview(false);
			if (!stream) return;
		}
		phase = 'connecting';
		try {
			const conn = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			});
			pc = conn;
			// addTrack creates the send-only transceivers; don't also addTransceiver
			// or the m-line order won't match SRS's answer.
			for (const track of stream.getTracks()) conn.addTrack(track, stream);

			// SRS bridges WebRTC→RTMP, which requires H.264 video. Browsers often
			// offer VP8 first; pin H.264 so the bridge doesn't drop the publish.
			try {
				const caps = RTCRtpSender.getCapabilities?.('video');
				const h264 = caps?.codecs.filter((c) => /h264/i.test(c.mimeType)) ?? [];
				if (h264.length) {
					for (const t of conn.getTransceivers()) {
						if (t.sender.track?.kind === 'video' && 'setCodecPreferences' in t) {
							t.setCodecPreferences(h264);
						}
					}
				}
			} catch {
				/* setCodecPreferences unsupported — fall back to default negotiation */
			}

			const offer = await conn.createOffer();
			await conn.setLocalDescription(offer);

			const res = await fetch(whipUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp',
					Authorization: `Bearer ${auth.token ?? ''}`
				},
				body: offer.sdp ?? ''
			});
			if (!res.ok) {
				throw new Error(
					res.status >= 500
						? 'Media server busy — if you were just live, wait a few seconds and try again.'
						: `Ingest rejected the broadcast (${res.status})`
				);
			}
			const answer = await res.text();
			await conn.setRemoteDescription({ type: 'answer', sdp: answer });

			conn.addEventListener('connectionstatechange', () => {
				if (conn.connectionState === 'connected') phase = 'live';
				else if (['failed', 'disconnected', 'closed'].includes(conn.connectionState) && phase === 'live') {
					toast.error('Broadcast connection lost');
					stop();
				}
			});
			phase = 'live';
			toast.success('You are live from the browser');
		} catch (e) {
			toast.error((e as Error)?.message ?? 'Could not start the broadcast');
			phase = stream ? 'preview' : 'idle';
			pc?.close();
			pc = null;
		}
	}

	function stop() {
		pc?.close();
		pc = null;
		stopTracks();
		stream = null;
		if (videoEl) videoEl.srcObject = null;
		phase = 'idle';
	}

	function stopTracks() {
		stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
	}

	$effect(() => () => stop()); // cleanup on unmount
</script>

<div class="card overflow-hidden">
	<div class="flex items-center justify-between px-6 py-4">
		<div>
			<h2 class="text-base font-semibold">Go live from your browser</h2>
			<p class="text-sm text-[var(--color-muted)]">No encoder needed — camera or screen, straight to your stream.</p>
		</div>
		{#if phase === 'live'}
			<span class="flex items-center gap-1.5 text-sm font-medium text-red-500">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
				</span>
				LIVE
			</span>
		{/if}
	</div>

	<div class="relative aspect-video bg-black">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video bind:this={videoEl} autoplay playsinline muted class="h-full w-full object-contain"></video>
		{#if phase === 'idle'}
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/70">
				<Video size={32} />
				<p class="text-sm">Start your camera or share your screen to preview.</p>
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2 px-6 py-4">
		{#if phase === 'idle'}
			<button class="btn-primary" onclick={() => startPreview(false)}>
				<Video size={16} /> Start camera
			</button>
			<button class="btn-ghost" onclick={() => startPreview(true)}>
				<MonitorUp size={16} /> Share screen
			</button>
		{:else}
			<button
				class="btn-ghost {camOn ? '' : 'text-red-500'}"
				onclick={toggleCam}
				disabled={sharing}
				title="Toggle camera"
			>
				{#if camOn}<Video size={16} />{:else}<VideoOff size={16} />{/if}
			</button>
			<button
				class="btn-ghost {micOn ? '' : 'text-red-500'}"
				onclick={toggleMic}
				title="Toggle microphone"
			>
				{#if micOn}<Mic size={16} />{:else}<MicOff size={16} />{/if}
			</button>
			<button class="btn-ghost" onclick={() => startPreview(!sharing)}>
				{#if sharing}<Video size={16} /> Camera{:else}<MonitorUp size={16} /> Screen{/if}
			</button>

			<div class="flex-1"></div>

			{#if phase === 'live'}
				<button class="btn-danger" onclick={stop}>
					<Radio size={16} /> Stop broadcast
				</button>
			{:else}
				<button class="btn-primary" onclick={goLive} disabled={phase === 'connecting'}>
					{#if phase === 'connecting'}<Loader2 size={16} class="animate-spin" /> Connecting…{:else}<Radio
							size={16}
						/> Go live{/if}
				</button>
			{/if}
		{/if}
	</div>
</div>
