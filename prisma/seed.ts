const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MOCK_ANIME = [
  {
    id: "1",
    title: { English: "Solo Leveling", Japanese: "俺だけレベルアップな件", Chinese: "我独自升级" },
    image: "https://images.alphacoders.com/134/1344605.png",
    banner: "https://images.alphacoders.com/134/1344605.png",
    year: "2024",
    rating: "9.1",
    episodes: "12",
    description: "In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jin-woo finds himself in a seemingly endless struggle for survival.",
    tags: ["Action", "Fantasy", "New Release"],
  },
  {
    id: "2",
    title: { English: "Demon Slayer", Japanese: "鬼滅の刃", Chinese: "鬼灭之刃" },
    image: "https://images6.alphacoders.com/101/1013401.jpg",
    banner: "https://images6.alphacoders.com/101/1013401.jpg",
    year: "2019",
    rating: "8.7",
    episodes: "26",
    description: "Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself.",
    tags: ["Action", "Demons", "Historical"],
  },
  {
    id: "3",
    title: { English: "Jujutsu Kaisen", Japanese: "呪術廻戦", Chinese: "咒术回战" },
    image: "https://images.alphacoders.com/109/1092822.jpg",
    banner: "https://images.alphacoders.com/109/1092822.jpg",
    year: "2020",
    rating: "8.8",
    episodes: "24",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    tags: ["Action", "Supernatural", "School"],
  },
];

async function main() {
  console.log("Start seeding...");
  
  // Clear existing (optional)
  // await prisma.anime.deleteMany();

  for (const a of MOCK_ANIME) {
    // Note: Since our schema doesn't have an 'Anime' model yet (we use IDs mapping to hosts),
    // we would need an Anime model for Discovery.
    // I noticed Milestone 5.3 mentions migrating to real Prisma queries.
    // I should add an Anime model to schema.prisma first!
  }
}

// main() ...
