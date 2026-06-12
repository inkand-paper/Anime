# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (main) | Yes |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email: security@anistream.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will respond within 48 hours and aim to patch within 7 days.

## Security Measures

- bcrypt password hashing (12 rounds)
- JWT sessions with short expiry
- Content Security Policy headers
- Rate limiting on auth endpoints
- Input validation with Zod
- CORS restricted to app origin
- SQL injection prevented by Prisma ORM
