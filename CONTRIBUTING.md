# Contributing to AnimePortal

We welcome contributions! Please follow these guidelines to ensure a smooth development process.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/Anime.git
   cd Anime
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   node prisma/seed.js
   ```

4. **Environment**
   Copy `.env.example` to `.env` and fill in the secrets.

5. **Start Dev Server**
   ```bash
   npm run dev
   ```

## Coding Standards

- **TypeScript**: All new code must be strictly typed.
- **UI Architecture**:
  - Use `lucide-react` for icons. No emojis in the final UI.
  - Follow the "Charcoal/Indigo/Blue" premium aesthetic.
  - Prefer Tailwind CSS classes for styling.
- **Components**: Keep components atomic and reusable. Use `src/components`.
- **Security**: 
  - All input must be validated via Zod.
  - Sensitive operations should be Server Actions with proper auth checks.
  - Use the built-in middleware for security headers.

## Pull Request Process

1. Create a feature branch (`feat/your-feature`).
2. Run `npm run lint` and `npx tsc --noEmit` before committing.
3. Ensure the UI remains responsive and matches the premium design.
4. Update `README.md` or `Done.md` if adding significant features.

## Reporting Issues

Use the GitHub Issue tracker. Be descriptive and include steps to reproduce.

---
AnimePortal v2.4 • High-Performance Streaming Platform
