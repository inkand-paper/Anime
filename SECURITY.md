# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| v2.4.x  | :white_check_mark: |
| < v2.3  | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please report it privately via email to `security@animeportal.com`.

**Please include:**
1. A detailed description of the vulnerability.
2. Steps to reproduce the issue.
3. Potential impact.

We will respond within 48 hours and coordinate a fix.

## Hardened Features

Our platform implements the following security measures:

- **NextAuth v5**: Secure session management with HTTP-only cookies.
- **Bcrypt Hashing**: All passwords salted and hashed with 12 rounds.
- **CSP Headers**: Content Security Policy enforced via middleware to prevent XSS.
- **Rate Limiting**: Nginx-level limiting on auth (5/min) and API (30/min) routes.
- **DevTools Detection**: Client-side logic to prevent inspection and code theft.
- **Security Gate**: Bot-mitigation layer with attempt tracking and lockout.
- **Zod Validation**: Strict schema enforcement on all user-supplied data.

---
AnimePortal v2.4 • Secure & Reliable
