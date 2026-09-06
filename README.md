# Streaming Schedule

A permanent home for your streaming schedule — past, current, and future — with a live Twitch
player, built as a minimal, technical "developer streaming log" rather than a generic SaaS
dashboard.

## What's included (MVP)

This is Phase 1–3 of the full product vision: the public homepage timeline, individual stream
pages, live Twitch detection, and an admin area to manage streams.

- **Public homepage** — live/offline state, next stream with countdown, upcoming streams,
  recent streams
- **Stream detail pages** (`/streams/[slug]`) with SEO metadata, VOD links, cancelled state
- **Live Twitch integration** — official embedded player, shown only while you're live;
  Twitch client secret never reaches the browser
- **Admin area** (`/admin`) — sign in, dashboard stats, full stream CRUD (create, edit, delete,
  duplicate, reschedule, cancel)
- **Database-backed archive** — Postgres via Prisma is the source of truth for everything
  except "are we live right now," which Twitch answers
- **Timezone-correct scheduling** — every time is stored in UTC and rendered in the stream's
  configured timezone, handling daylight saving correctly
- **Unit tests** for the parts that are easy to get subtly wrong: stream ordering, next-stream
  selection, live-state resolution, and timezone conversion

**Not included yet** (deferred per the phased build-out — see `Roadmap` below): the full
`/streams`, `/series`, `/projects`, `/stats` browsing pages, recurring-schedule generation,
tags/resources admin UI, and notifications. The database schema already supports series,
projects, and tags — you can assign them to a stream from the admin form — there just isn't a
dedicated browsing page for them yet.

## Architecture

```
Next.js (App Router)         — frontend + API routes, deployed on Vercel
  ├─ src/app                 — pages (public + /admin) and API routes
  ├─ src/components          — TwitchPlayer, StreamCard, Countdown, StatusBadge, etc.
  └─ src/lib
      ├─ streams.ts          — pure business logic (ordering, next-stream, live-state)
      ├─ time.ts             — timezone conversion, countdowns, relative labels
      ├─ slug.ts             — slug generation + uniqueness
      ├─ twitch/             — client (raw Helix calls), service (caching), mapper
      ├─ auth.ts             — NextAuth credentials config
      └─ db.ts               — Prisma client singleton

Postgres (via Prisma)        — source of truth for streams, series, projects, tags, admin users
Twitch Helix API             — source of truth for live status only, cached ~30s server-side
```

Twitch credentials (`TWITCH_CLIENT_SECRET`) are only ever read inside `src/lib/twitch/client.ts`,
which runs server-side (API routes / server components). The browser never sees them.

## Local development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Postgres on Neon

We target [Neon](https://neon.tech) (serverless Postgres, free tier, no DB cold starts).
Create a project, then under **Connect** grab **both** connection strings:

- **Pooled connection** (host ends in `-pooler.neon.tech`) → your `DATABASE_URL`. This is what
  the app uses at runtime, and it handles Vercel's serverless concurrency.
- **Direct connection** (host `ep-*.neon.tech`, no `-pooler`) → your `DIRECT_URL`. Prisma uses
  this for `db push` / migrations.

Append `?sslmode=require` (and `&pgbouncer=true` if the pooled URL doesn't already have it) to
both.

### 3. Create a Twitch application

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) and register an app
2. Note the **Client ID** and generate a **Client Secret**
3. OAuth redirect URL doesn't matter for this app (we only use the client-credentials flow, not
   user login)

Twitch vars are optional — live status fails soft to "offline" if they're missing.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `DIRECT_URL`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`,
`TWITCH_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and generate a `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 5. Push the database schema and seed your admin user

```bash
pnpm prisma:generate
pnpm prisma:push
pnpm db:seed
```

Set `SEED_SAMPLE_DATA="true"` in `.env` first if you want two sample streams so the homepage
isn't empty while you're setting things up — delete them from `/admin/streams` whenever.

### 6. Run it

```bash
pnpm dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin/login` to
sign in with the admin email/password you seeded.

### 7. Run the tests

```bash
pnpm test
```

## Deploying to Vercel with Neon

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com) (free tier).
   Vercel auto-detects Next.js and runs `pnpm install`, which triggers the
   `postinstall` → `prisma generate` script (see `package.json`), so the Prisma client is
   generated during the build automatically.
2. In **Vercel → Project → Settings → Environment Variables**, add every variable from your
   `.env`, but override the URL-based ones for production:
   - `DATABASE_URL` → your Neon **pooled** URL
   - `DIRECT_URL` → your Neon **direct** URL
   - `NEXTAUTH_URL` → `https://<your-project>.vercel.app` (your real domain)
   - `NEXT_PUBLIC_SITE_URL` → same real domain
3. Create the tables and admin user **once**, pointed at the same Neon project:
   ```bash
   pnpm prisma:push
   pnpm db:seed
   ```
   Run this from your machine with the production URLs in `.env` (or a one-off Vercel
   build/CLI step). If you use different local vs production databases, make sure you run these
   against production.
4. Deploy from `main`. Give Neon's IP allow-list access on Vercel's docs if you enabled it
   (Neon usually has allow-all on the free tier).

Vercel's free tier serverless functions do have a brief cold start after inactivity, but the
homepage itself is statically revalidated every 30 seconds (`export const revalidate = 30` in
`src/app/page.tsx`), so visitors essentially always hit a warm, cached page.

## How live detection works

`src/lib/twitch/service.ts` checks Twitch's Helix API for your channel and caches the result for
30 seconds in memory. The homepage and stream detail pages call this on render. If Twitch's API
is unreachable for any reason, the site fails soft and shows "offline" rather than erroring.

The `Stream.status` field in the database is *your* record of what should be happening
(`SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED`) — it's independent of Twitch. The homepage
combines both: Twitch says *whether* you're live right now; if there's a scheduled stream whose
time window contains the current moment, its title/description/series/tags are shown alongside
the live player. If you go live without a matching scheduled stream, the player still shows with
Twitch's own title and category.

## Roadmap (not yet built)

- `/streams`, `/series/[slug]`, `/projects/[slug]` full archive/browsing pages with search,
  filtering, and pagination
- Admin UI for series, projects, tags, and resources (currently: create via `POST /api/series`
  and `POST /api/projects`, or directly in the database — the Stream form already lets you
  *assign* existing series/projects)
- Recurring schedule generation (`RecurringSchedule` model exists in the schema; the job that
  turns it into individual `Stream` rows isn't built yet)
- `/stats` page (streaming hours per month, per series, per category)
- `.ics` calendar export, Discord notifications
