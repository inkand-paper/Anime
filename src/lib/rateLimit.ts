import { prisma } from "./prisma";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number; // milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding-window rate limiter backed by PostgreSQL.
 * Falls back to allow on DB error so it never hard-blocks on infra failure.
 */
export async function rateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const record = await prisma.rateLimit.upsert({
      where: { key },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        key,
        count: 1,
        resetAt,
      },
    });

    // Window expired — reset
    if (record.resetAt < now) {
      await prisma.rateLimit.update({
        where: { key },
        data: { count: 1, resetAt },
      });
      return { success: true, remaining: limit - 1, resetAt };
    }

    const remaining = Math.max(0, limit - record.count);
    return {
      success: record.count <= limit,
      remaining,
      resetAt: record.resetAt,
    };
  } catch {
    // Fail open — never block users due to DB rate-limit table issues
    return { success: true, remaining: limit, resetAt };
  }
}
