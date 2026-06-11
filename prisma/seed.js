const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MOCK_ANIME = [
  {
    titleEn: "Solo Leveling",
    titleJp: "俺だけレベルアップな件",
    titleCn: "我独自升级",
    image: "https://images.alphacoders.com/134/1344605.png",
    banner: "https://images.alphacoders.com/134/1344605.png",
    year: "2024",
    rating: 9.1,
    episodes: 12,
    description: "In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jin-woo finds himself in a seemingly endless struggle for survival.",
    tags: "Action,Fantasy,New Release",
  },
  {
    titleEn: "Demon Slayer",
    titleJp: "鬼滅の刃",
    titleCn: "鬼灭之刃",
    image: "https://images6.alphacoders.com/101/1013401.jpg",
    banner: "https://images6.alphacoders.com/101/1013401.jpg",
    year: "2019",
    rating: 8.7,
    episodes: 26,
    description: "Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself.",
    tags: "Action,Demons,Historical",
  },
  {
    titleEn: "Jujutsu Kaisen",
    titleJp: "呪術廻戦",
    titleCn: "咒术回战",
    image: "https://images.alphacoders.com/109/1092822.jpg",
    banner: "https://images.alphacoders.com/109/1092822.jpg",
    year: "2020",
    rating: 8.8,
    episodes: 24,
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    tags: "Action,Supernatural,School",
  },
];

async function main() {
  console.log("Start seeding...");
  
  for (const a of MOCK_ANIME) {
    const anime = await prisma.anime.upsert({
      where: { id: a.titleEn.toLowerCase().replace(/\s+/g, '-'), titleEn: a.titleEn }, // Simple ID for seeding
      update: { ...a },
      create: { 
        id: a.titleEn.toLowerCase().replace(/\s+/g, '-'),
        ...a 
      },
    });
    console.log(`Created anime: ${anime.titleEn}`);
    
    // Create a mock mapping for episode 1
    await prisma.hostMapping.upsert({
        where: { animeId_episode_hostName: { animeId: anime.id, episode: 1, hostName: "Goda" } },
        update: {},
        create: {
            animeId: anime.id,
            episode: 1,
            hostName: "Goda",
            url: "https://example.com/embed/goda/1",
            type: "iframe"
        }
    });
  }
  
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
