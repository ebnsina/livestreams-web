<div align="center">

# Livestreams Web

**Self-hosted live streaming & video platform — dashboard**

A SvelteKit single-page app for operating the platform: go live, watch playback,
manage recordings & transcodes, restream to other platforms, and follow real-time
activity. Talks to the [backend API](../api) over HTTP only.

[Features](#features) · [Quick start](#quick-start) · [Configuration](#configuration) · [Project structure](#project-structure)

</div>

---

## Overview

This is the operator-facing frontend for Livestreams — a pure **single-page app**
(`adapter-static`) that consumes the backend's REST + SSE API. It has no server of
its own and can be hosted on any static host or CDN.

## Features

- **Dashboard** — live status, key stats, recent streams, and viewer trends.
- **Streams** — create/manage channels, reveal & rotate ingest keys, schedule,
  and watch live with a custom **hls.js** player (quality switching, seek-preview
  storyboards, volume/seek controls).
- **Recordings & VOD** — browse, play, upload videos, and cut clips.
- **Transcodes** — a console with **real-time progress** (SSE) and a detailed timeline.
- **Multistream** — connect YouTube/Twitch via OAuth, import stream keys, and manage
  restream destinations & simulcast presets.
- **Analytics** — audience and quality-of-service charts.
- **Operations** — jobs, activity logs, signed webhooks, and API keys.
- **Team** — multi-org with member invites and roles.
- **Embeds** — generate an embeddable player snippet for any VOD.
- **Polished UX** — cohesive design system (squircle surfaces, soft shadows),
  light & dark themes, toasts, dialogs, and accessible forms.

## Tech stack

[SvelteKit 2](https://svelte.dev) · Svelte 5 (runes) · TypeScript ·
[Tailwind CSS v4](https://tailwindcss.com) ·
[TanStack Svelte Query](https://tanstack.com/query) · hls.js · adapter-static (SPA).

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- The backend API running (see [`../api`](../api))

## Quick start

```bash
cp .env.example .env        # set PUBLIC_API_BASE_URL (default http://localhost:8085)
pnpm install
pnpm dev                    # → http://localhost:5173
```

## Configuration

| Variable | Description |
| --- | --- |
| `PUBLIC_API_BASE_URL` | Base URL of the backend API (e.g. `http://localhost:8085`) |

## Scripts

```bash
pnpm dev       # development server with HMR
pnpm build     # production build → build/
pnpm preview   # preview the production build
pnpm check     # type-check (svelte-check)
pnpm format    # format with Prettier
pnpm lint      # lint
```

## Project structure

```
src/lib/
  api.ts          typed REST client (JWT handling, problem+json parsing)
  auth.svelte.ts  auth store (runes)
  theme.svelte.ts light/dark theme store
  query.ts        TanStack query keys
  types.ts        DTOs mirroring the API contract
  components/     player, dialogs, charts, page chrome, …
src/routes/
  login · register · forgot · reset · verify   auth (2-column shell)
  (app)/          authed dashboard shell + pages
    dashboard · streams · recordings · transcodes · analytics
    jobs · logs · webhooks · api-keys · team · settings
```

## Design system

The UI is driven by CSS variables in `src/routes/layout.css` — a single set of
design tokens (accent color, surfaces, radii, shadows) controls the entire look in
both light and dark mode. Reusable `.btn-*`, `.card`, `.input` classes and a
`squircle` utility keep components consistent.

## License

Proprietary — all rights reserved.
