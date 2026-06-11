import { auth } from "@/auth";
import { NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: "USER" | "PREMIUM" | "ADMIN";
  isPremium: boolean;
  referralCode?: string;
}

/** Get the typed session user from a server component or route handler. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  // @ts-expect-error custom fields added in jwt callback
  const role: string = session.user.role ?? "USER";
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    role: role as SessionUser["role"],
    isPremium: role === "PREMIUM" || role === "ADMIN",
    // @ts-expect-error custom fields
    referralCode: session.user.referralCode,
  };
}

/** Get IP address from a request (middleware or route handler). */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
