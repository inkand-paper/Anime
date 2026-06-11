# AnimePortal — Production Hardening Changelog

All completed changes for the production-level overhaul (Milestone 5).

---

## Milestone 5.1 — Backend Security & Auth Hardening

- **Password hashing**: Implemented `bcryptjs` with 12 rounds in `registerUser` server action.
- **Zod validation**: All registration inputs validated server-side with descriptive field-level errors returned to the client.
- **Transactional referral rewards**: Referral reward now uses `prisma.$transaction` to ensure atomic subscription creation and role update.
- **NextAuth hardening**: Replaced placeholder auth with real `compare()` verification against hashed passwords. Added `role` to JWT token and session.
- **Security middleware**: `src/middleware.ts` sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers globally. Adds route-level auth protection for `/watchlist` and `/profile`.
- **Prisma schema hardening**: Added DB indexes on all foreign keys (`userId`, `email`, `referralCode`, `animeId`). Added `PasswordResetToken` model for future email-based resets. All relations use `onDelete: Cascade`.

## Milestone 5.2 — UI/UX Refinement

- **All emojis removed** from every component: `SecurityGate`, `Navbar`, `Hero`, `AnimeCard`, `PremiumModal`, and `AdBanner`.
- **Professional iconography**: Replaced with `lucide-react` icons throughout — `ShieldCheck`, `Lock`, `Fingerprint`, `Languages`, `Globe`, `Star`, `Play`, `Check`, `Plus`, `Users`, `Zap`, `Ban`, `Monitor`, `Gift`, `X`, etc.
- **Navbar redesign**: Rounded `rounded-2xl` buttons, glassmorphism language dropdown with section header, professional icon-only social buttons.
- **Hero redesign**: Impact typography (`text-8xl font-black tracking-tighter`), badge row with `Calendar`/`Tv`/`Star` icons, glassmorphism CTAs.
- **AnimeCard redesign**: `rounded-3xl` cards, cleaner lock overlay with `Lock` icon, icon-button play/watchlist actions.
- **PremiumModal redesign**: Feature list uses icon + text layout (no emojis), legal footer, encrypted badge with `Lock` icon.
- **SecurityGate redesign**: `ShieldCheck` header icon, attempt progress dots, `Fingerprint` input icon, `Timer` for lockout state.

## Milestone 5.3 — Data Integrity & DB Features

- **Anime model**: Added `Anime` model to Prisma schema with `titleEn`, `titleJp`, `titleCn`, `image`, `banner`, `year`, `rating`, `episodes`, `tags` (comma-separated).
- **HostMapping relation**: Connected `HostMapping` to `Anime` model with cascade delete. Renamed fields for clarity (`hostName`, `url`, `type`).
- **Home page wired to DB**: `src/app/page.tsx` is now a server component that fetches real `Anime` rows via Prisma and maps them to component types.
- **Video resolver wired to DB**: `resolveVideoSources()` now queries `hostMapping` table for dubbed sources (priority 1–7), then falls back to Consumet Gogoanime and Zoro APIs.
- **Seed script**: `prisma/seed.js` populates the database with initial anime records and mock episode host mappings.
- **Database migrated**: Two migrations applied — `production_hardening` and `add_anime_discovery_model`.

## Milestone 5.4 — DevOps & Deployment

- **Multi-stage Dockerfile**: `deps` → `builder` → `runner` with non-root `nextjs` user.
- **docker-compose.yml**: Orchestrates `app` (Next.js), `redis`, and `nginx` with health checks and named volumes.
- **Nginx config**: HTTP redirect, TLS 1.3, security headers, gzip, rate-limiting zones (30 req/min API, 5 req/min auth), static asset caching.
- **Docker entrypoint**: Runs `prisma migrate deploy` before starting the server.
- **Health check endpoint**: `GET /api/health` returns `{ status: "ok", timestamp }`.
- **`.gitignore`**: Excludes `.env`, SQLite files, `.next/`, `node_modules/`.
- **`.env.example`**: Documents every environment variable with descriptions and examples.
- **`README.md`**: Full developer documentation — setup, env vars, DB commands, video host registration, Docker deployment, SSL, security overview, project structure, and roadmap.
