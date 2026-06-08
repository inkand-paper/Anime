"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const referralCode = formData.get("referralCode") as string;

  // 1. Generate unique referral code for new user
  const newReferralCode = `ANIME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 2. Check and reward referer
  let referredBy = null;
  if (referralCode) {
    const referer = await prisma.user.findUnique({
      where: { referralCode: referralCode },
    });

    if (referer) {
      referredBy = referer.id;
      
      // Reward referer: 2 months premium
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

      await prisma.subscription.upsert({
        where: { userId: referer.id },
        update: {
          status: "ACTIVE",
          plan: "PREMIUM",
          endDate: twoMonthsFromNow,
        },
        create: {
          userId: referer.id,
          status: "ACTIVE",
          plan: "PREMIUM",
          endDate: twoMonthsFromNow,
        },
      });
    }
  }

  // 3. Create User
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password, // Note: In production, hash this!
      referralCode: newReferralCode,
      referredBy,
      subscription: {
        create: {
          status: "INACTIVE",
          plan: "FREE",
        }
      }
    },
  });

  revalidatePath("/");
  return { success: true, user };
}
