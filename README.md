# AniStream

A production-grade anime streaming platform built with Next.js 15, TypeScript, Tailwind CSS 4, Prisma, and real streaming APIs.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/inkand-paper/Anime.git
cd Anime

# 2. Install (postinstall auto-runs prisma generate)
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — set AUTH_SECRET and optionally ANIWATCH_API_URL

# 4. Set up database
npx prisma db push
# Optional: seed demo accounts
npx prisma db seed

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

> **Note:** `npm install` automatically runs `prisma generate` via the `postinstall` script.  
> If you see `@prisma/client did not initialize yet`, run `npx prisma generate` manually then restart.

## Streaming Setup

Video playback requires the AniWatch API. The fastest way to get it running for free:

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Use repo: `https://github.com/ghoshRitesh12/aniwatch-api`
3. Copy the Railway URL into `.env.local` as `ANIWATCH_API_URL`

A public fallback is used if the variable isn't set, but it's rate-limited — not for production.

## Features

- **15,000+ anime titles** via AniList GraphQL (no API key required)
- **Real HLS video streams** via AllAnime/AniWatch API
- **Sub + Dub** with automatic quality fallback
- **7-host dubbed upload system** (Doodstream, VOE, Filemoon, Streamwish, Streamtape, MixDrop, Megastream)
- **Watch Together** — synchronized playback with invite links
- **Referral system** — 2-month premium reward
- **Pre-roll + mid-roll ads** with skip countdown
- **Anti-bot CAPTCHA** + DevTools guard
- **Admin dashboard** — user management, host health monitoring
- **Premium paywall** — PayPal, Google Pay, card
- **Fully responsive** — mobile, tablet, desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma |
| Auth | NextAuth v5 (credentials + JWT) |
| Anime data | AniList GraphQL API |
| Streaming | AllAnime / AniWatch API |
| Video | HLS.js + server-side CORS proxy |
| Icons | Lucide React |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | **Yes** | NextAuth v5 secret (generate: `npx auth secret`) |
| `DATABASE_URL` | **Yes** | SQLite: `file:./dev.db` or PostgreSQL URL |
| `NEXTAUTH_URL` | **Yes** | App URL (e.g. `http://localhost:3000`) |
| `ANIWATCH_API_URL` | Recommended | Self-hosted AniWatch API URL |
| `ADMIN_EMAILS` | Optional | Comma-separated admin email addresses |
| `WEBHOOK_SECRET` | Optional | For billing webhook verification |

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run setup        # prisma generate + prisma db push (first-time setup)
npm run db:push      # Push schema changes to DB
npm run db:seed      # Seed demo accounts
npm run db:studio    # Open Prisma Studio
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

## Demo Accounts (after `npm run db:seed`)

| Email | Password | Role |
|---|---|---|
| admin@anistream.com | admin123! | Admin |
| premium@anistream.com | premium123! | Premium |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── anime/[id]/          # AniList metadata proxy
│   │   ├── anime/[id]/episode/  # Stream source resolver
│   │   ├── anime/search/        # Search + browse endpoint
│   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   ├── billing/webhook/     # PayPal/Stripe webhook
│   │   └── proxy/video/         # HLS CORS proxy
│   ├── browse/                  # Browse & search page
│   ├── watch/[id]/              # Watch page + video player
│   ├── profile/                 # User profile + referral code
│   ├── admin/                   # Admin control panel
│   ├── login/ signup/           # Auth pages
│   └── watchlist/               # Saved anime
├── components/
│   ├── VideoPlayer.tsx          # HLS.js player + ads
│   ├── AnimeCard.tsx            # Card with hover expand
│   ├── AnimeGrid.tsx            # Horizontal scroll row
│   ├── Hero.tsx                 # Featured anime banner
│   ├── Navbar.tsx               # Navigation
│   ├── SearchOverlay.tsx        # Live search
│   ├── SecurityGate.tsx         # Anti-bot CAPTCHA
│   ├── WatchTogetherModal.tsx   # Sync room creation
│   ├── PremiumModal.tsx         # Subscription upsell
│   └── AdBanner.tsx             # Ad placements
├── context/
│   ├── LanguageContext.tsx      # English / Japanese / Chinese
│   ├── WatchlistContext.tsx     # Local watchlist state
│   └── SubscriptionContext.tsx  # Premium status
└── lib/
    ├── anilist.ts               # AniList GraphQL client
    ├── aniwatch.ts              # AllAnime streaming client
    ├── video-resolver.ts        # DB → API source resolution
    ├── prisma.ts                # Prisma singleton
    └── validations.ts           # Zod schemas
```

## GitHub Actions

Workflow files are in `docs/github-actions/`. To enable:

1. Copy the YAML files to `.github/workflows/`
2. Add repository secrets: `AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`, `ANIWATCH_API_URL`, `WEBHOOK_SECRET`

## Security

- Content Security Policy with strict directives
- HSTS, X-Frame-Options DENY, COOP, CORP, COEP
- bcrypt password hashing (12 rounds)
- JWT sessions with role claims
- Rate limiting via DB-backed sliding window
- Anti-bot CAPTCHA on entry
- DevTools detection (F12, keyboard shortcuts, window resize)
- Zod validation on all API inputs

See [SECURITY.md](SECURITY.md) for the vulnerability disclosure policy.
