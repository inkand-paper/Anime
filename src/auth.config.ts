import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      isPremium: boolean;
      referralCode?: string;
    };
  }
}

export const authConfig = {
  providers: [], // filled in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as Record<string, unknown>).role as string ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id as string ?? token.sub ?? "";
        session.user.role      = (token.role as string) ?? "USER";
        session.user.isPremium = session.user.role === "PREMIUM" || session.user.role === "ADMIN";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!session?.user;

      // Protect profile + watchlist
      if (["/profile", "/watchlist"].some((p) => pathname.startsWith(p))) {
        return isLoggedIn;
      }
      // Protect admin
      if (pathname.startsWith("/admin")) {
        return isLoggedIn && session?.user?.role === "ADMIN";
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
} satisfies NextAuthConfig;
