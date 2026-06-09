"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const referralCode = formData.get("referralCode") as string | null;

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Hash password (bcrypt, 12 rounds)
  const passwordHash = await hash(password, 12);

  // Generate unique referral code for new user
  const newReferralCode = `ANIME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Handle referral reward
  let referredBy: string | null = null;
  if (referralCode?.trim()) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
    if (referrer) {
      referredBy = referrer.id;

      // Credit referrer: 2 months premium
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

      await prisma.subscription.upsert({
        where: { userId: referrer.id },
        update: { status: "ACTIVE", plan: "PREMIUM", endDate: twoMonthsFromNow },
        create: { userId: referrer.id, status: "ACTIVE", plan: "PREMIUM", endDate: twoMonthsFromNow },
      });

      // Flip referrer to premium
      await prisma.user.update({
        where: { id: referrer.id },
        data: { role: "PREMIUM" },
      });
    }
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      referralCode: newReferralCode,
      referredBy,
      subscription: {
        create: { status: "INACTIVE", plan: "FREE" },
      },
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function getUserReferralCode(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  return user?.referralCode ?? null;
}
