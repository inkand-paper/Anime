import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Admin user
  const adminPassword = await hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@anistream.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@anistream.com",
      password: adminPassword,
      role: "ADMIN",
      referralCode: "ADMIN-SEED",
      subscription: {
        create: { plan: "MONTHLY", status: "ACTIVE" },
      },
    },
  });

  // 2. Demo premium user
  const premiumPassword = await hash("premium123!", 12);
  await prisma.user.upsert({
    where: { email: "premium@anistream.com" },
    update: {},
    create: {
      name: "Premium User",
      email: "premium@anistream.com",
      password: premiumPassword,
      role: "PREMIUM",
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

  // 3. Anime catalog — use AniNeko slugs as IDs so /watch/:id resolves correctly
  const MOCK_ANIME = [
    {
      id: "solo-leveling",
      titleEn: "Solo Leveling",
      titleJp: "俺だけレベルアップな件",
      titleCn: "我独自升级",
      image: "https://images.alphacoders.com/134/1344605.png",
      banner: "https://images.alphacoders.com/134/1344605.png",
      year: "2024",
      rating: 9.1,
      episodes: 12,
      description:
        "In a world where hunters must battle deadly monsters, a notoriously weak hunter named Sung Jin-woo finds himself in a seemingly endless struggle for survival — until he discovers a mysterious quest system that allows him to level up alone.",
      tags: "Action, Fantasy, New Release",
    },
    {
      id: "demon-slayer-kimetsu-no-yaiba",
      titleEn: "Demon Slayer",
      titleJp: "鬼滅の刃",
      titleCn: "鬼灭之刃",
      image: "https://images6.alphacoders.com/101/1013401.jpg",
      banner: "https://images6.alphacoders.com/101/1013401.jpg",
      year: "2019",
      rating: 8.7,
      episodes: 26,
      description:
        "Tanjiro Kamado's family is slaughtered by a demon, and his sister Nezuko is transformed into one. He sets out to find a cure and avenge his family by joining the Demon Slayer Corps.",
      tags: "Action, Demons, Historical",
    },
    {
      id: "jujutsu-kaisen",
      titleEn: "Jujutsu Kaisen",
      titleJp: "呪術廻戦",
      titleCn: "咒术回战",
      image: "https://images.alphacoders.com/109/1092822.jpg",
      banner: "https://images.alphacoders.com/109/1092822.jpg",
      year: "2020",
      rating: 8.8,
      episodes: 24,
      description:
        "A boy swallows a cursed talisman — the finger of a demon — and becomes cursed himself. He enters a shaman's school to locate the demon's other body parts and exorcise himself.",
      tags: "Action, Supernatural, School",
    },
    {
      id: "attack-on-titan",
      titleEn: "Attack on Titan",
      titleJp: "進撃の巨人",
      titleCn: "进击的巨人",
      image: "https://images5.alphacoders.com/100/1008870.jpg",
      banner: "https://images5.alphacoders.com/100/1008870.jpg",
      year: "2013",
      rating: 9.0,
      episodes: 87,
      description:
        "Humanity survives inside enormous walled cities to protect themselves from titanic humanoid creatures called Titans. Eren Yeager vows to eliminate all Titans after they destroy his hometown.",
      tags: "Action, Dark Fantasy, Military",
    },
    {
      id: "one-piece",
      titleEn: "One Piece",
      titleJp: "ワンピース",
      titleCn: "海贼王",
      image: "https://wallpapercave.com/wp/wp9330575.jpg",
      banner: "https://wallpapercave.com/wp/wp9330575.jpg",
      year: "1999",
      rating: 9.1,
      episodes: 1000,
      description:
        "Monkey D. Luffy sets sail to find the legendary One Piece and become the Pirate King, assembling a crew of talented pirates along the way.",
      tags: "Adventure, Comedy, Shounen",
    },
  ];

  for (const a of MOCK_ANIME) {
    await prisma.anime.upsert({
      where: { id: a.id },
      update: {
        titleEn: a.titleEn,
        titleJp: a.titleJp,
        titleCn: a.titleCn,
        image: a.image,
        banner: a.banner,
        year: a.year,
        rating: a.rating,
        episodes: a.episodes,
        description: a.description,
        tags: a.tags,
      },
      create: a,
    });
  }

  console.log("✅ Admin:", admin.email);
  console.log(`✅ Anime catalog seeded: ${MOCK_ANIME.length} titles`);
  console.log("✅ Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
