# AniStream

A production-grade anime streaming platform built with Next.js 15, TypeScript, Tailwind CSS, Prisma, and real streaming APIs.

## Features

- **10,000+ anime titles** via AniList GraphQL API (free, no key required)
- **Real HLS video streams** via AniWatch/AllAnime API (self-hostable)
- **7-host dubbed fallback** — Doodstream, VOE, Filemoon, Streamwish, Streamtape, MixDrop, Megastream
- **Sub + Dub** playback with subtitle track support
- **Pre-roll + mid-roll ads** with skip countdown
- **Watch Together** — synchronized playback with invite links
- **Referral system** — unique codes, 2-month premium reward
- **Auth** — email/password (bcrypt), NextAuth sessions
- **Premium paywall** — PayPal, Google Pay, card payments
- **Admin dashboard** — user management, host health, billing controls
- **Security** — CSP, HSTS, rate limiting, anti-bot CAPTCHA, DevTools guard
- **Fully responsive** — mobile, tablet, desktop

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma |
| Auth | NextAuth v5 (credentials + JWT) |
| Anime data | AniList GraphQL API |
| Streaming | AniWatch API (AllAnime) |
| Video | HLS.js with CORS proxy |
| Icons | Lucide React |

## Quick Start

### 1. Clone

```bash
git clone https://github.com/inkand-paper/Anime.git
cd Anime
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
# Edit .env.local — minimum required:
#   DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

### 4. Database

```bash
npx prisma db push      # creates SQLite dev.db
npx prisma db seed      # creates admin + demo users (optional)
```

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

## Streaming API Setup

Video playback requires the AniWatch API. Self-host it for free on Railway:

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Repo: `https://github.com/ghoshRitesh12/aniwatch-api`
3. Copy the Railway URL into `.env.local` as `ANIWATCH_API_URL`

A public fallback (`https://aniwatch-api-production-4b7e.up.railway.app`) is used if the env var is not set, but it is rate-limited and should not be used in production.

## GitHub Actions

Workflow files are in `docs/github-actions/`. To activate:

1. Copy `docs/github-actions/*.yml` to `.github/workflows/`
2. Add secrets in GitHub → Settings → Secrets and variables → Actions:
   - `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `NEXT_PUBLIC_APP_URL`, `ANIWATCH_API_URL`, `WEBHOOK_SECRET`
   - For Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Production Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard.

### Docker

```bash
docker-compose up -d
```

Configure `nginx.conf` for your domain and obtain TLS certificates via Certbot.

## Demo Accounts

After running `npx prisma db seed`:

| Email | Password | Role |
|---|---|---|
| admin@anistream.com | admin123! | Admin |
| premium@anistream.com | premium123! | Premium |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── anime/          # AniList + AniWatch proxies
│   │   ├── auth/           # NextAuth handler
│   │   ├── billing/        # Webhook receiver
│   │   └── proxy/video     # HLS CORS proxy
│   ├── browse/             # Browse & search page
│   ├── watch/[id]/         # Watch page
│   ├── profile/            # User profile
│   └── admin/              # Admin dashboard
├── components/             # React components
├── context/                # React contexts (Language, Watchlist, Subscription)
├── lib/                    # Utilities
│   ├── anilist.ts          # AniList GraphQL client
│   ├── aniwatch.ts         # AniWatch/AllAnime streaming client
│   ├── video-resolver.ts   # Source resolution (DB → streaming API)
│   ├── prisma.ts           # DB client singleton
│   └── validations.ts      # Zod schemas
└── hooks/                  # Custom hooks
```

## Security

- Content Security Policy with explicit frame-src for all 7 streaming hosts
- HSTS, X-Frame-Options DENY, COOP, CORP, COEP headers
- bcrypt (12 rounds) password hashing
- JWT sessions with role and isPremium claims
- DB-backed rate limiting on auth routes
- Anti-bot CAPTCHA gate on entry
- DevTools detection (F12, Ctrl+Shift+I, window resize threshold)
- Input validation with Zod on all API endpoints

See [SECURITY.md](SECURITY.md) for the vulnerability disclosure policy.
