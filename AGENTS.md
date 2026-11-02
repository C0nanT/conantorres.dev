# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal site for Conan Torres (content creator / educator). Next.js 15 App Router, React 18, TypeScript, Tailwind 3, shadcn/ui (new-york) + Radix, Framer Motion / `motion`, `next-intl`. Started from create-t3-app; the T3 boilerplate is gone (no tRPC/Prisma/NextAuth, no env validation). Only the book reader (`READER_PASSWORD`, `BOOK_FILE_*`, `DATA_DIR`, see Deploy) and the maintenance switch on the about and projects pages (`APP_ENV`) read env vars; the rest of the site works without them.

## Commands

Package manager: pnpm (Node >= 22).

```bash
pnpm dev               # dev server (Turbopack, see below)
pnpm build             # production build (standalone output)
pnpm check             # biome lint + format check
pnpm check:fix         # biome auto-fix
pnpm typecheck         # type check (tsc --noEmit)
pnpm test              # unit tests (node --test, pure reader modules)
```

`pnpm dev` runs `next dev --turbopack` because webpack's dev server cannot open the book reader: loading `pdfjs-dist` throws `Object.defineProperty called on non-object`, and the reader's `error.tsx` ("O leitor encontrou um erro") replaces the viewer. `pdf.mjs` declares its own top-level `var __webpack_exports__`, which shadows webpack's in the dev `eval` wrapper; production builds (`pnpm build`) concatenate modules and are fine, and Next reverts any `devtool` change in dev. Do not switch `dev` back to webpack while the reader uses `react-pdf`.

Unit tests exist only for the pure reader modules: `src/**/*.test.ts`, run by `pnpm test` (Node's built-in runner, `node --test`) and by CI before the build. They run on Node 22 type stripping, so a tested module imports only `node:*` (no `@/` alias, no `next/*`) and its test imports it with the `.ts` extension. Beyond those modules, broader testing is not wanted: this is a portfolio site. Do not add a test framework or declare test seams for components, pages or actions, even when a skill (`tdd`, `to-spec`, `to-tickets`, `implement`, …) asks for them. Where a skill requires a testing section for that code, write "no automated tests" and verify with `pnpm check`, `pnpm typecheck`, `pnpm build` and a manual check. Pre-commit hook (husky + lint-staged) runs `biome check --write` on staged files.

## Architecture

**Content lives in `data/site.json`, not in components.** Profile, social links, YouTube channels/videos, courses, about/philosophy copy, SEO keywords, site URL and Clarity ID are all there. `src/lib/site-data.ts` imports it, defines the `SiteData` type and exposes `site` plus helpers (`getSiteUrl`, `getOgImageUrl`, `getYouTubeVideoUrl`, …). When adding fields to `site.json`, update the `SiteData` interface too — the JSON is cast, not validated.

**UI strings live in `messages/pt.json`** (namespaces: navigation, common, hero, about, metadata, …), accessed via `useTranslations` / `getTranslations`.

**i18n is effectively Portuguese-only:**
- `src/lib/navigation.ts` declares `locales = ['pt']` with `localePrefix: 'never'` (URLs carry no locale); exports locale-aware `Link`, `redirect`, `usePathname`, `useRouter` — use these instead of `next/link`/`next/navigation`.
- `src/i18n.ts` always loads `pt` messages.
- `src/middleware.ts` rewrites every non-asset route into `src/app/[locale]/` (not `/api`).
- `src/app/[locale]/layout.tsx` still lists `['pt', 'en']` in `generateStaticParams` and has `pt`/`en` branches, on purpose (English planned), but there is no `messages/en.json`.

**Routing / layout:** `src/app/layout.tsx` is a thin root (metadataBase + Clarity, no `<html>`). `robots.ts`, `sitemap.ts`, `manifest.ts` and `global-error.tsx` live at `src/app/` root, not under `[locale]` (robots and manifest are not served from there). The real `<html>` shell is `src/app/[locale]/layout.tsx`: JSON-LD structured data, Geist fonts, `NextIntlClientProvider`, `Toaster`. Below it are three route groups:
- `(site)/`: every public page (`(home)`, `about`, `books`, `certificates`, `projects`). Its `layout.tsx` adds `Navigation`, `RouteTransition`, `Footer` and the WhatsApp button; it also holds the site's `error.tsx`, `loading.tsx` and `not-found.tsx`.
- `(unmatched)/`: only `[...rest]/page.tsx`, which calls `notFound()`, so URLs that match no page get the styled 404 with a 404 status. It re-exports the `(site)` layout and not-found page. It sits outside `(site)` on purpose: a page under a `loading.tsx` streams, and its `notFound()` then answers 200. A segment `not-found.tsx` alone only catches `notFound()` calls, and a root one would render without the `<html>` shell.
- `(reader)/`: the full-screen book reader (`books/[id]/ler`), with no site chrome, plus its own `error.tsx` and `not-found.tsx`. `ler/loading.tsx` says the first open downloads the book; `ler/layout.tsx` checks the book id before that boundary for the same 404-status reason.

Page-specific components live in colocated `_components/` folders with an `index.ts` barrel (e.g. `src/app/[locale]/(site)/(home)/_components/`). Metadata per page goes through `generateLocalizedMetadata(locale, page)` in `src/lib/metadata.ts`, which reads the `metadata` message namespace + `site.json`.

**Components:** `src/components/ui` (shadcn primitives only, so `shadcn add` never touches a component written by hand), `src/components/layout` (site chrome: nav/footer, navigation-dock, navigation-card, route-transition, locale-switch), `src/components/common` (other custom pieces: logos, whatsapp-floating-button, fancy-button, social-button, loading-screen, initial-loading, clarity). `cn()` and `tv` (tailwind-variants re-export) both live in `src/lib/styling.ts` (shadcn alias `utils`), next to the other helpers in `src/lib/`. Path alias `@/*` → `src/*`.

Remote images must be whitelisted in `next.config.mjs` `images.remotePatterns` (currently only YouTube thumbnails).

## Deploy

Production: own VPS behind the shared Traefik edge, `docker-compose.prod.yml` (copied to `/opt/apps/conan-torres/docker-compose.yml` with the VPS `.env`): GHCR image (`IMAGE_TAG`, default `latest`), no `ports:`, `expose` 8080, external network `proxy`, healthcheck inherited from the Dockerfile `HEALTHCHECK` (not repeated in compose), `le-dns` labels for `conantorres.dev` + wildcard, `www` redirected to the apex, project `name: conan-torres` so the volume stays `conan-torres_leitor-data`. Deploy: `docker compose pull && docker compose up -d`. Local dev: `docker compose up -d --build` (`docker-compose.yml`, single `web` service built from the `Dockerfile`, port 8080 on host and container; no Traefik). One named volume, `leitor-data` at `/app/reader-data`, holds the book reader's SQLite file (see **Reader data**); everything else in the container is reset by an image rebuild.

- `next.config.mjs`: `output: 'standalone'`; `outputFileTracingRoot` is pinned to the project folder.
- `Dockerfile`: multi-stage. The builder (`node:22-alpine`) runs `pnpm install --frozen-lockfile` and `pnpm build`. The runtime stage copies only `.next/standalone`, `.next/static` and `public`, runs as the non-root `node` user with `node server.js`, and sets `HOSTNAME=0.0.0.0`, `PORT=8080`, `DATA_DIR=/app/reader-data`, `EXPOSE 8080`. It creates `/app/reader-data` owned by `node` before `USER node`. Compose does not override `command`.
- Health: `GET /api/health` answers `200 {"status":"ok"}` (`Cache-Control: no-store`) whenever the server is up. It needs no reader password, reads no env var and never opens the database, so a missing secret or a bad volume cannot make the container unhealthy. The Dockerfile's `HEALTHCHECK` polls it with busybox `wget` on `127.0.0.1:${PORT:-8080}` (interval 30s, timeout 5s, start period 20s, 3 retries); `/api` is outside the i18n middleware.
- Image: `.github/workflows/deploy-image.yml` ("Build & Push Image") builds the Dockerfile and pushes `ghcr.io/c0nant/conan-torres` with tags `latest` and the commit SHA after the `CI` workflow succeeds on a push to `main` (or by hand via `workflow_dispatch`, which skips CI and therefore only runs on `main`). It passes no build args: the build reads no env var and `.env*` is dockerignored, so every secret comes from the VPS `.env` at runtime. The GHCR package must stay private (check its visibility in the package settings after the first push).
- `.dockerignore` keeps `.env*` (except `.env.example`), both compose files, `.git`, host `node_modules` and `.next`, tool folders (`.claude`, `.cursor`, `.scratch`, `.vscode`, `.husky`, `.github`), `docs` and markdown out of the image.
- `sharp` ships in the standalone output, so `next/image` works at runtime. So does `better-sqlite3`: Next externalizes it on its own (no `serverExternalPackages`), and the trace copies its native `build/Release/better_sqlite3.node` into `.next/standalone/node_modules`. The alpine builder needs no build tools because `pnpm install` downloads the prebuilt musl binary from GitHub releases. If that download is ever blocked, it falls back to node-gyp, and the builder then needs `apk add python3 make g++`. pnpm >= 10 blocks install scripts, so an upgrade must add `better-sqlite3` to `pnpm.onlyBuiltDependencies`.

**Environment variables** (book reader and `APP_ENV`; `.env.example` lists them). On the VPS they live in an uncommitted `.env` next to the compose file. Both `docker-compose.yml` (local) and `docker-compose.prod.yml` (VPS) pass `READER_PASSWORD`, `READER_DEBUG`, `APP_ENV` and every `BOOK_FILE_*` (today only `BOOK_FILE_MONOLITO_PARA_MICROSSERVICOS`) in `environment:` as `${VAR:-}`, except `APP_ENV` in `docker-compose.prod.yml`, which defaults to `production`; `DATA_DIR` is not passed, the Dockerfile sets it. Never commit a real value, not even a placeholder one.
- `APP_ENV`: `production` on the VPS, `development` locally. `src/lib/app-env.ts` (`isProductionEnv()`) is the only reader. When it is `production`, `/about` and `/projects` render `MaintenancePage` (`src/components/common/maintenance-page.tsx`, strings in the `maintenance` namespace) instead of its content; unset counts as development (the prod compose never leaves it unset). The image is built without `.env`, so both pages render per request (`connection()`) to read it at runtime.
- `READER_PASSWORD`: unlocks `/books/<id>/ler`. Unset or blank: the reader refuses access with a message, and every other page still works. A correct password sets a 30-day httpOnly, sameSite, HMAC-signed cookie whose key derives from the password with scrypt (slow on purpose, computed once per process), so changing it signs out every device.
- `BOOK_FILE_<BOOK_ID_IN_CONSTANT_CASE>` (e.g. `BOOK_FILE_MONOLITO_PARA_MICROSSERVICOS`): Google Drive file ID (just the ID, never a URL) of the book's PDF, shared as "anyone with the link". One per book with `readable: true`; add the name to `.env.example`, `docker-compose.yml` and `docker-compose.prod.yml` (`${VAR:-}`) when a book becomes readable. Unset: the reader shows a message and logs it.
- `DATA_DIR`: folder of the reader's SQLite file. The Dockerfile sets it to `/app/reader-data` (the volume). Do not override it on the VPS. Unset (local `pnpm start`/`pnpm dev`): `./data-local`, which is gitignored and dockerignored.
- `READER_DEBUG`: optional, `1` turns on `[reader-debug]` lines (ISO timestamp, `evento=<name>` and `key=value` pairs): whether the PDF request carried the session cookie and its status, the login result with the client IP, the page's reader decision, the PDF cache hit or download with bytes and milliseconds. Off by default, so successes stay silent; read it with `docker compose logs web | grep reader-debug` or in the `pnpm dev` terminal. Never logs a password, cookie value, Drive file ID or URL; `src/lib/reader/log.ts` is the only place that writes it.
- Errors caught in the browser (pdf.js load or render failure, the reader's error boundary) are always reported to the server log as `[reader-client]` lines (`livro=`, `origem=`, `erro=`) through the `reportClientError` server action, which only writes for a signed-in reader. A production server error reaches the browser without its message; its `digest=` in `origem` is the key to find it in the server log. The viewer also shows the pdf.js error under "Não foi possível abrir o PDF". A page that fails to draw (`origem=pdf-pagina-N`, or `pdf-texto-N` for its text layer) shows its own message in its slot, and the other pages keep working.

**Reader access** goes through `src/lib/reader/access.ts` alone (`getReader()` returns the owner `conan` or `null`, plus `signIn`/`signOut`); protected pages, actions and routes must not read the cookie themselves. The future login replaces only that module. Wrong passwords are limited in memory by `src/lib/reader/rate-limit.ts`, a thin shell (it reads the headers and the clock) over the pure `rate-limit-core.ts`. Two limits apply, and each try is counted before the password is compared, so a parallel burst cannot slip past them together. Per IP: 3 failures lock that client IP for 20 min. Global: 10 failures in a sliding 24 h window, across every client. Once the global cap is reached, every try is refused, the right password included, until the oldest failure in the window expires; the message is the same as the per-IP lock, and the longer of the two locks is the one reported. A right password clears only that IP's counter, never the global one. Both live in process memory, with at most 10 000 tracked IPs, so a restart clears them. Whenever the global cap is reached, a `[reader-lock]` line is always written (see **Logs**).

The client IP is chosen in `src/lib/reader/client-ip.ts`. The chain in production is Cloudflare (orange cloud) → Traefik → app: Traefik's entrypoints trust Cloudflare's ranges through `forwardedHeaders.trustedIPs`, so Traefik keeps the forwarded chain and appends the address of its peer. The app takes the rightmost valid `x-forwarded-for` item that is outside Cloudflare's ranges, skipping invalid items. With no usable item it falls back to `x-real-ip`, then to a shared `unknown` bucket. Traffic that reaches Traefik without Cloudflare gets the same result, since the peer is then the only address appended. Cloudflare's ranges are a constant in `client-ip.ts`, mirrored from the `trustedIPs` list in traefik-default's `traefik/traefik.yml`: change both together. Locally (`docker-compose.yml`, port 8080 published, no proxy) the socket address is the only item, and a direct client there can set the header itself, which is fine for development.

Residual risk: the app also sits on the shared `proxy` network, so any other container there (another site on the same VPS) can reach `web:8080` directly and set the header itself. That is accepted, since those containers are the owner's own deployments, and the global cap limits what they can attempt. If a CDN other than Cloudflare is ever put in front of Traefik, update the ranges in `client-ip.ts` and revisit this.

**Book PDFs** are downloaded by `src/lib/reader/book-file.ts` from `drive.usercontent.google.com/download` on the first read (the server follows Drive's large-file confirmation form; anything that is not `%PDF-` is rejected) and cached at `$DATA_DIR/book-files/<book-id>.pdf` (`/app/reader-data/book-files/` in the image, `./data-local/book-files/` locally; both outside git). The browser only ever sees `/api/books/<id>/file`, which requires `getReader()` (401 otherwise) and never exposes the Drive ID or URL. Its 200 answers `Cache-Control: private, no-cache` with `ETag` (size and mtime of the cached file) and `Last-Modified`, so the browser keeps the PDF but revalidates on every open: after the access check, a matching `If-None-Match` gets a bodiless 304 (`[reader-debug]` `status=304`); no reader still gets 401. Deleting the cached file changes the ETag, so the next open downloads the new one. To refresh after replacing the file in Drive, delete the cached file and reload the reader: `docker compose exec web rm /app/reader-data/book-files/<book-id>.pdf` (locally `rm data-local/book-files/<book-id>.pdf`). The cache has no expiry and lives in the data volume, so rebuilds, deploys and `rm -rf .next` keep it; only deleting the file (or `docker compose down -v`) makes the next read download it again. The leitor.db backup below does not include the PDFs, which Drive can always restore. Failures show a Portuguese message in the reader and write one line prefixed `[book-file]` (ISO timestamp, `livro=<id>`, `motivo=<code>`, optional `detalhe`; never the file ID or URL): `docker compose logs web | grep book-file`. Reason codes: `missing-env`, `invalid-book-id`, `not-found` (bad ID), `drive-failed`, `not-pdf` (private file or error page), `confirm-page`, `too-large`, `io-error`.

**Reader data** (saved page and total pages) lives in one SQLite file, `$DATA_DIR/leitor.db`, written with `better-sqlite3`.
- Layers: `src/lib/reader/db.ts` owns the connection and the schema. `src/lib/reader/reading-position.ts` (`getReadingPosition`, `saveCurrentPage`, `setTotalPages`) are the only code with SQL, all scoped by owner and book. `getReadableBook(id)` in `site-data.ts` is the one check that a book id exists and is `readable`; the page, the actions and the file route handler use it. Pages and server actions call those functions, never SQL, and the owner always comes from `getReader()`. `src/lib/reader/page-number.ts` holds the page-number validation shared by the form and the action; it is pure, so it is safe in the browser.
- **Viewer** (`books/[id]/ler/_components/`): `pdf-viewer.tsx` holds the shared state (current page, zoom, total) and joins `pdf-toolbar.tsx`, `pdf-page-list.tsx` and `pdf-page-item.tsx`. The book is one continuous column: every page has a slot of its size (page 1's ratio until a page has loaded once), so the scrollbar covers the whole book. Only the pages inside the render window are drawn: the scroller plus `RENDER_AROUND` (2) page heights on each side, watched by an `IntersectionObserver` rooted at the scroller. A page leaving it unmounts its canvas and text layers and calls pdf.js `page.cleanup()` (without it the tab grows with every page read). Expect about 4 to 7 canvases at once, plus pdf.js's hidden text-measuring canvas. The current page is the one covering the scroller's vertical centre, updated at most once per animation frame; it feeds "x de N" and prefills "Parei na página". Opening scrolls to the saved page; the arrows and "Ir para a página" scroll to a page (all instant), and the requested page stays current until the user scrolls. A new width (zoom, resize) keeps the same spot on screen: during the render that carries the new size (the DOM still has the old layout) the list reads the page at the scroller's centre and how far down it the centre is, as a fraction, and a layout effect scrolls back to that page and fraction (instant). Measured drift is under 0.2 line.
- The connection opens lazily on the first query, never at module load, so `pnpm build` needs no database or volume. The first open creates the folder, then applies the schema idempotently through `PRAGMA user_version` (append a new step to `MIGRATIONS` and never edit a released one).
- Tables: `reading_positions` (`owner`, `book_id`, `current_page`, `total_pages`, `updated_at`; primary key `(owner, book_id)`). The `highlights` table from the removed highlight feature is left in the schema, unused, so any existing rows are kept (migrations are never edited and the table is never dropped).
- `total_pages` is written the first time the viewer loads the PDF, and again if the page count changes. `current_page` and `updated_at` stay `NULL` until a page is saved from the "Parei na página" field. Nothing saves automatically, and the browser keeps no copy of the position.
- The journal mode is the default rollback mode (`DELETE`, no `-wal`/`-shm` files), so `leitor.db` alone is the whole database.
- Failures log one line prefixed `[reader-db]` (ISO timestamp, `operacao=<op>`, `erro=<message>`). If the database is unreadable, the reader still opens on page 1, and saving shows an error.
- **Public progress** is decided in `src/lib/reader/book-progress.ts` (`getBooks()`): a `readable` book with a saved page shows `round(current_page / total_pages * 100)` and the `updated_at` day in São Paulo (converted to `YYYY-MM-DD` there, the same shape as `site.json`'s dates, which render as UTC); every other book keeps `progress` / `progressUpdatedAt` from `site.json`. The books page renders per request (`connection()`) and reads the database each time, so a deploy never serves build-time numbers over a populated volume; at build, or if the database is unreadable (one `[reader-db]` line, `operacao=ler-progresso`), `site.json` is used. `savePage` calls `revalidateBookProgress()`; any new page that shows book progress must read `getBooks()` and be added there.

Volume and backup:
- Inspect the volume: `docker volume inspect conan-torres_leitor-data`. The prefix is the compose project name, which is the folder name by default.
- Back up, consistent even while the site runs: `docker compose exec web node -e "new (require('better-sqlite3'))('/app/reader-data/leitor.db').backup('/app/reader-data/backup.db').then(()=>console.log('ok'))"`, then `docker compose cp web:/app/reader-data/backup.db ./leitor-$(date +%F).db`. A plain `docker compose cp web:/app/reader-data/leitor.db ./` is also fine when no save is happening at that moment.
- Restore: `docker compose cp ./leitor.db web:/app/reader-data/leitor.db`, then `docker compose restart web`.
- A brand-new volume inherits `node:node` from the image's `/app/reader-data`. A volume that already exists and is root-owned (created before that `chown`, or by hand) stays root-owned, and the first save fails with a permission error. Fix it once with `docker run --rm -v conan-torres_leitor-data:/d alpine chown -R 1000:1000 /d`.
- `docker compose down -v` deletes the volume and every saved page (and any old highlight rows). Plain `down` and `up -d --build` keep it.
- Do not move the mount to `/app/data`: the standalone trace copies `data/*.json` there, and a volume would shadow them.

**YouTube live numbers live in the Next.js cache.** `src/lib/youtube/live-stats.ts` scrapes views/subscribers/video counts inside `unstable_cache` (24 h revalidate) and falls back to the `site.json` values when a scrape fails with no cached value. The cache writes to `/app/.next/cache` in the runtime image; `/app/.next` is copied with `--chown=node:node`, so the non-root user can write there. The cache is not carried from the build stage, so every rebuild resets it. The home page is prerendered during `pnpm build`: its HTML holds the build-time numbers, and that scrape is the first refetch. The first request after each 24 h window refetches. A post-deploy change in the numbers, or `site.json` values showing until the next window when the build-time scrape failed, is expected behaviour.

**Logs:** `docker compose logs web` (add `-t` for Docker timestamps, `--since 24h` to narrow). Capped by the `json-file` driver at 3 × 1 MB; older entries are discarded. Each failed scrape writes one line prefixed `[youtube-stats]` (ISO timestamp, target type and id, reason, whether the `site.json` fallback was used) and a target that recovers writes one `recuperado` line; successes are silent. `docker compose logs web | grep youtube-stats` filters them out of Next's own multi-line `revalidating cache with key` traces, which accompany background failures. The reader's password lockout writes `[reader-lock]` (always on, not behind `READER_DEBUG`): `evento=teto-global ip=<IP of the try that reached the cap>` when the global cap of wrong passwords is reached; `docker compose logs web | grep reader-lock` finds it.

## Conventions

Biome (`biome.json`) is strict and enforced; notable rules:
- Single quotes, no semicolons, 2-space indent, 80-col lines, ES5 trailing commas.
- `noForEach` (use `for...of`/`map`), `noArrayIndexKey`, `noExplicitAny`, `useBlockStatements`, `useImportType`, `useAwait`, `noConsoleLog` (warn).
- `useNamingConvention`: functions camelCase/PascalCase, variables camelCase/CONSTANT_CASE/PascalCase, types PascalCase.
- a11y rules are errors (`useButtonType`, `useAltText`, `noBlankTarget`, `useKeyWithClickEvents`, …).

Code style:
- kebab-case file and directory names; PascalCase components/types; event handlers prefixed `handle`, booleans `is/has/can`.
- Functional/declarative code, early returns, no classes; prefer Server Components, `'use client'` only where needed.
- Animations: purposeful, compositor-friendly properties (transform/opacity), interruptible, and must respect `prefers-reduced-motion`.

## SOLID

Apply SOLID at the **architecture** level: module boundaries, dependency direction, and the interfaces between them. It is a way to shape seams, not a naming ritual. "Module" means whatever this codebase groups behaviour into: a class, a package, a file of functions, a service.

### Scope: boy scout rule

SOLID applies to:

- code written new in the current change, and
- the existing code the current flow already passes through, when a small local edit clears friction that change is hitting.

The rest of the codebase stays as it is. Keep a change's blast radius on the flow being built or fixed: a repo-wide SOLID refactor is its own piece of work, and happens only when explicitly asked for. The codebase converges one change at a time.

When applying a principle would require reshaping modules outside the current flow, leave them alone and say so in the summary of the change.

### The principles, as architecture rules

- **SRP**: a module has one reason to change. When one flow forces edits in a module that other flows also own for unrelated reasons, that module is holding two responsibilities.
- **OCP**: new behaviour arrives as a new implementation behind an existing interface, rather than another branch in a growing conditional over kinds of thing.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/`, both created lazily. See `docs/agents/domain.md`.
