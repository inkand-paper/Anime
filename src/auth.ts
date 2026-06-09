import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { subscription: true },
        });

        if (!user || !user.password) return null;

        const valid = await compare(credentials.password as string, user.password);
        if (!valid) return null;

        // Check subscription status
        const isPremium =
          user.role === "PREMIUM" ||
          user.role === "ADMIN" ||
          (user.subscription?.status === "ACTIVE" && user.subscription?.plan === "PREMIUM");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPremium,
          referralCode: user.referralCode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom fields
        token.role = user.role;
        // @ts-expect-error custom fields
        token.isPremium = user.isPremium;
        // @ts-expect-error custom fields
        token.referralCode = user.referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // @ts-expect-error custom fields
        session.user.role = token.role;
        // @ts-expect-error custom fields
        session.user.isPremium = token.isPremium;
        // @ts-expect-error custom fields
        session.user.referralCode = token.referralCode;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
