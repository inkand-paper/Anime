import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // NextAuth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for compat
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Lazy DB import — if prisma generate hasn't been run yet,
        // this fails gracefully instead of crashing the whole server
        let user: {
          id: string;
          name: string | null;
          email: string;
          password: string | null;
          role: string;
        } | null = null;

        try {
          const { prisma } = await import("@/lib/prisma");
          user = await prisma.user.findUnique({ where: { email } });
        } catch (e) {
          console.error(
            "[auth] DB unavailable. Run: npx prisma generate && npx prisma db push\n",
            e
          );
          return null;
        }

        if (!user?.password) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
