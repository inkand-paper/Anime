"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  referralCode: z.string().optional().or(z.literal("")),
});

export async function registerUser(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode"),
  });

  if (!validatedFields.success) {
    return { 
      success: false, 
      message: "Validation failed", 
      errors: validatedFields.error.flatten().fieldErrors 
    };
  }

  const { name, email, password, referralCode } = validatedFields.data;

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "An account with this email already exists." };
    }

    // 2. Hash password
    const hashedPassword = await hash(password, 12);

    // 3. Generate unique referral code for new user
    const newReferralCode = `ANIME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Check and reward referer
    let referredBy = null;
    if (referralCode && referralCode.trim() !== "") {
      const referer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });

      if (referer) {
        referredBy = referer.id;
        
        // Reward referer: 2 months premium
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

        await prisma.$transaction([
          prisma.subscription.upsert({
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
          }),
          prisma.user.update({
            where: { id: referer.id },
            data: { role: "PREMIUM" },
          })
        ]);
      }
    }

    // 5. Create User
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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
    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Internal server error during registration." };
  }
}

export async function getUserReferralCode(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    return user?.referralCode ?? null;
  } catch (error) {
    console.error("Fetch referral code error:", error);
    return null;
  }
}
