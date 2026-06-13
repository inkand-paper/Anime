/**
 * Runtime setup check — called from middleware.
 * Logs a single clear message if Prisma isn't generated yet
 * instead of letting cryptic errors cascade.
 */
let checked = false;

export async function checkSetup(): Promise<void> {
  if (checked) return;
  checked = true;

  try {
    await import("@prisma/client");
  } catch {
    console.error(
      "\n" +
      "╔══════════════════════════════════════════════════════╗\n" +
      "║  SETUP REQUIRED — Prisma client not generated        ║\n" +
      "║                                                      ║\n" +
      "║  Run these commands once:                            ║\n" +
      "║    1. cp .env.example .env.local                     ║\n" +
      "║    2. npx prisma generate                            ║\n" +
      "║    3. npx prisma db push                             ║\n" +
      "║    4. npm run dev                                    ║\n" +
      "╚══════════════════════════════════════════════════════╝\n"
    );
  }
}
