# livestreams-web — agent guide

SvelteKit **SPA** for a **live streaming & video SaaS** (sold as a subscription —
not self-hosted) — a public marketing landing page plus the operator dashboard
(go live from the browser or an
encoder, multistream, recordings/VOD, transcodes, AI captions, unified live chat,
secure delivery, analytics). This repo is **independent**; it has no backend code and
talks to the API **only over HTTP**.

- **Backend repo:** `../api` (Go REST API + media workers).
  It owns the API contract and the architecture docs:
  - `../api/docs/plan.md` — full architecture, decisions, roadmap, security.
  - `../api/docs/data-model-and-api.md` — **the REST contract** this app
    consumes. Check here when adding/changing API calls.
  - `../api/docs/phase-1.md` — current build phase.

  The API base URL is configured via `PUBLIC_API_BASE_URL` (`.env`), default
  `http://localhost:8085`. Run the backend with `make api` in that repo.

## Git & commits (IMPORTANT)
- Author every commit as **`ebnsina <ebnsina.me@gmail.com>`** — per-repo config:
  `git config user.name "ebnsina" && git config user.email "ebnsina.me@gmail.com"`.
- **Do NOT** add a `Co-Authored-By: Claude` trailer, and do NOT use any other identity.
- Remote uses the `github-es` SSH host alias.

## Tech stack
SvelteKit 2 · **Svelte 5 (runes)** · TypeScript · **Tailwind CSS v4** (`@tailwindcss/vite`;
theme via `@theme` in `src/routes/layout.css`) · **TanStack Svelte Query v6** · hls.js ·
**adapter-static** (pure SPA: `ssr=false`, `prerender=false` in `src/routes/+layout.ts`).

## Layout
```
src/lib/
  api.ts            typed REST client (attaches JWT, parses problem+json, clears on 401)
  auth.svelte.ts    runes auth store (localStorage-persisted tokens)
  types.ts          DTOs mirroring the backend — keep in sync with the API contract
  query.ts          TanStack query keys
  components/        StatusBadge, CopyField, Player (hls.js)
src/routes/
  +layout.svelte    QueryClientProvider + global theme
  +layout.ts        ssr=false / prerender=false (SPA)
  login/ register/  auth pages
  (app)/            authed shell (sidebar + guard)
    dashboard/  streams/  streams/[id]/
```

## Conventions (IMPORTANT)
- **Verify library APIs against current docs (context7) before using them — never assume.**
  This was scaffolded with the official `npx sv create`.
- **TanStack Query is v6**, not v5: `createQuery(() => ({ queryKey, queryFn }))` (args wrapped
  in a function) and results are **plain rune objects** (`query.data`, `query.isPending`,
  `query.isError`) — NOT `$`-prefixed stores. Same for `createMutation`.
- **Svelte 5 runes** everywhere: `$state`, `$derived`, `$props`, `$effect`. Reactive `.ts`
  modules use the `.svelte.ts` extension.
- Build a **beautiful, professional UI**; reuse the `.btn-*`, `.card`, `.input`, `.label`,
  `.badge` (uppercase, tight-tracking), `.squircle` classes and CSS theme tokens in
  `layout.css`. Body sets `font-variant-numeric: tabular-nums`.
- **Animation is Svelte built-ins only — no 3rd-party libs.** Use `svelte/transition`
  (fade/fly/scale), `svelte/animate` (flip), `svelte/motion` (`Tween`) and `svelte/easing`.
  Dialogs/modals/menus/toasts already animate; the scroll-reveal action lives in
  `src/lib/actions/reveal.ts`. Numeric stats use the slot-machine odometer
  `components/AnimatedNumber.svelte` (`value` + `format` props). Always respect
  `prefers-reduced-motion`.
- **Forms validate with Zod** (`src/lib/schemas.ts`, `fieldErrors()`): inline errors +
  `novalidate` on the `<form>`.
- When the API contract changes in `../api`, update `src/lib/types.ts` and
  `src/lib/api.ts` to match.

## Commands
```
pnpm install
cp .env.example .env     # set PUBLIC_API_BASE_URL
pnpm dev                 # http://localhost:5173
pnpm check               # svelte-check (must be clean)
pnpm build               # SPA build to build/
pnpm format / lint       # Prettier
```

## Status
Full product UI, well beyond the original dashboard:

- **Marketing landing page** at `/` (public), 2-column auth pages (`AuthShell`).
- **Dashboard shell:** sidebar + topbar; pages for streams, recordings, transcodes,
  analytics (custom charts w/ axes + hover), jobs, logs, webhooks, API keys, team,
  settings (incl. theme + BYO OAuth/AI).
- **Streams:** create (choose webcam vs encoder), detail (hls.js player, ingest
  reveal/rotate, QoS, multistream, recordings, activity), and a dedicated **Studio**
  (`/streams/[id]/studio`) for browser go-live (WebRTC/WHIP) + live chat.
- **Player:** quality switching, seek-preview storyboards, **caption tracks**,
  graceful states (protected / not-ready-auto-retry / error), and **stream-end
  detection** (HLS end-of-list, live→offline, buffering watchdog → "ended"
  overlay instead of infinite buffering).
- **Playback analytics:** a built-in per-view tracker (`src/lib/tracker.ts`,
  `PlaybackTracker`) ships start/heartbeat/end pings (final flush via
  `sendBeacon`) capturing engagement (watch time, completion, seeks) + QoE +
  device/OS/browser dimensions to `POST /v1/playback/track`. Surfaced by
  `InsightsPanel` (engagement KPIs + country/device/browser/OS breakdowns) on
  the analytics and stream pages.
- **Cross-cutting:** create-forms-in-dialogs, secure-link generator, toasts, and a
  friendly error system (`+error.svelte`, `ErrorState`, hardened API client).

Design is **token-driven** (olive accent, squircle corners, soft shadows; light/dark)
via CSS vars in `src/routes/layout.css`, with a library-free animation layer throughout.
Backend billing is deferred (free tier for now).
