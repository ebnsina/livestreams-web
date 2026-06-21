# livestreams-web

Web dashboard for the live streaming platform — a SvelteKit single-page app that talks to
the backend (`../api`) over its REST API. Manage streams, watch live playback, switch
renditions, browse recordings, and follow real-time activity.

## Tech stack

SvelteKit 2 · Svelte 5 (runes) · TypeScript · Tailwind CSS v4 · TanStack Svelte Query ·
hls.js · adapter-static (SPA).

## Prerequisites

- Node.js 20+
- pnpm
- The backend API running (see `../api`)

## Quick start

```bash
cp .env.example .env        # set PUBLIC_API_BASE_URL (default http://localhost:8085)
pnpm install
pnpm dev                    # http://localhost:5173
```

## Scripts

```bash
pnpm dev       # development server
pnpm build     # production build (build/)
pnpm preview   # preview the production build
pnpm check     # type-check (svelte-check)
pnpm format    # format with Prettier
```

## Project structure

```
src/lib/         API client, stores, types, UI components
src/routes/      pages — auth, dashboard, streams, jobs & logs
```

## License

Proprietary — all rights reserved.
