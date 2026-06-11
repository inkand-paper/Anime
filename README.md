# AnimePortal

A production-ready anime streaming platform built with Next.js. Features a premium HBO Max-inspired UI, multi-host video fallback, user authentication, subscription paywall, and a referral system.

---

## Features

- **Security Gate** — Math-based bot challenge with session persistence and lockout
- **DevTools Detection** — Detects F12 / inspect-element attempts and reloads the page
- **Authentication** — NextAuth.js v5 with bcrypt password hashing and JWT sessions
- **Subscription Paywall** — FREE / PREMIUM tiers; new releases locked for free users
- **Referral System** — Unique referral codes; referrers earn 2 free months of premium
- **Multi-Host Video Resolver** — Queries 7 dubbed-video hosts from the database, then falls back to Consumet (Gogoanime → Zoro) for subbed content
- **Ad Integration** — Pre-roll/mid-roll ad injection in the video player plus on-page banner slots
- **Watch Together** — Room-based synchronized viewing (modal stub; WebSocket in Phase 4)
- **Live Search** — Instant anime suggestions with history
- **Multi-Language Titles** — English / Japanese / Chinese switcher
- **Watchlist** — Add / remove titles, persisted per user session

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Framework   | Next.js 14 (App Router, Server Actions) |
| Language    | TypeScript                              |
| Styling     | Tailwind CSS v4                         |
| Database    | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Auth        | NextAuth.js v5 (Auth.js)               |
| Validation  | Zod                                     |
| Security    | bcryptjs · CSP middleware · Nginx rate-limit |
| Deployment  | Docker + Docker Compose + Nginx         |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (production only)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/inkand-paper/Anime.git
cd Anime

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set AUTH_SECRET

# 4. Set up the database
npx prisma migrate dev
node prisma/seed.js

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. Required variables:

| Variable          | Description                                      |
|-------------------|--------------------------------------------------|
| `AUTH_SECRET`     | Random 32-byte string for JWT signing            |
| `DATABASE_URL`    | Prisma connection string (SQLite or PostgreSQL)  |
| `NEXTAUTH_URL`    | Public URL of the app                            |
| `CONSUMET_API_URL`| Base URL of your Consumet instance               |

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Database

### Schema overview

```
User → Account, Session, Profile, Subscription, WatchlistItem
Anime → HostMapping
```

### Migrations

```bash
# Apply pending migrations in development
npx prisma migrate dev

# Apply pending migrations in production
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio
```

### Seeding

```bash
node prisma/seed.js
```

---

## Registering a Dubbed Episode

After uploading a dubbed video to one of the 7 supported hosts, register it so the resolver can find it:

```typescript
import { registerHostMapping } from "@/lib/video-resolver";

await registerHostMapping(
  "solo-leveling",   // anime ID in the DB
  1,                 // episode number
  "Doodstream",      // host name (see DUBBED_HOSTS constant)
  "https://dood.re/e/xxxxxx",
  "iframe"
);
```

Supported hosts: `Doodstream`, `VOE`, `Filemoon`, `Streamwish`, `Streamtape`, `MixDrop`, `Megastream`.

---

## Production Deployment

### Docker Compose (recommended)

```bash
# Copy and fill in environment
cp .env.example .env

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app

# Run migrations (first deploy only)
docker compose exec app npx prisma migrate deploy
docker compose exec app node prisma/seed.js
```

Services started:
- `animaportal_app` — Next.js on port 3000
- `animaportal_redis` — Redis on port 6379
- `animaportal_nginx` — Nginx on ports 80 / 443

### SSL / TLS

Place your certificate files in `./ssl/`:
```
ssl/cert.pem
ssl/key.pem
```

For Let's Encrypt, use Certbot and mount the certs into the Nginx container.

---

## Security Overview

| Layer              | Implementation |
|--------------------|----------------|
| Bot detection      | SecurityGate math challenge (session-persisted, lockout after 5 fails) |
| DevTools mitigation| `useDevToolsDetection` hook — detects F12 / resize and reloads |
| Password storage   | bcrypt, 12 rounds |
| Input validation   | Zod schemas on all Server Actions |
| Auth sessions      | NextAuth.js JWT, `httpOnly` cookies |
| HTTP headers       | CSP, HSTS, X-Frame-Options, X-Content-Type-Options (middleware + Nginx) |
| Rate limiting      | Nginx zones: 30 req/min (API), 5 req/min (auth) |
| DB relations       | Cascading deletes prevent orphan records |

---

## Project Structure

```
src/
  app/
    (pages)/          Next.js App Router pages
    api/
      auth/           NextAuth route handler
      health/         Docker health check endpoint
  components/         Shared UI components
  context/            React context providers (Language, Watchlist, Subscription)
  data/               Static seed types & MOCK_ANIME fallback
  lib/
    prisma.ts         Singleton Prisma client
    actions.ts        Server Actions (registerUser, etc.)
    video-resolver.ts Multi-host video resolution logic
  middleware.ts       Global CSP + auth route guard
prisma/
  schema.prisma       Database schema
  migrations/         Prisma migration history
  seed.js             Database seed script
Dockerfile            Multi-stage production image
docker-compose.yml    Full stack orchestration
nginx.conf            Reverse proxy + rate limiting
.env.example          Environment variable reference
```

---

## Roadmap

- [x] Phase 1: Foundation, Security Gate, Discovery UI
- [x] Phase 2: Auth, Database, Subscription Paywall, Referral System
- [x] Phase 3: Video Player, Multi-Host Resolver, Ad Integration
- [ ] Phase 4: Watch Together (WebSocket sync + live chat)
- [ ] Phase 5: Admin Dashboard, Stripe/PayPal integration, Analytics

---

## License

Private repository. All rights reserved.
