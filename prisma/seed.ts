import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminPassword = await hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@anistream.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@anistream.com",
      password: adminPassword,
      role: Role.ADMIN,
      referralCode: "ADMIN-SEED",
      subscription: {
        create: { plan: "MONTHLY", status: "ACTIVE" },
      },
    },
  });

  // Demo premium user
  const premiumPassword = await hash("premium123!", 12);
  await prisma.user.upsert({
    where: { email: "premium@anistream.com" },
    update: {},
    create: {
      name: "Premium User",
      email: "premium@anistream.com",
      password: premiumPassword,
      role: Role.PREMIUM,
      referralCode: "PREMIUM-SEED",
      subscription: {
        create: {
          plan: "MONTHLY",
          status: "ACTIVE",
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log("Admin:", admin.email);
  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
