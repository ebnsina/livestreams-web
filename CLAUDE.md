# livestreams-web — agent guide

SvelteKit **SPA** dashboard for a self-hosted livestreaming SaaS. This repo is
**independent**; it has no backend code and talks to the API **only over HTTP**.

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
- Build a **beautiful, professional UI**; reuse the `.btn-*`, `.card`, `.input`, `.label`
  classes and CSS theme tokens in `layout.css`.
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
Phase 1 dashboard complete: auth, dashboard, streams list/create, stream detail (hls.js
player, ingest key reveal/rotate, live polling, session history). Backend billing is mocked.
