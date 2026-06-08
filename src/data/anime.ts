export interface Anime {
  id: string;
  title: {
    English: string;
    Japanese: string;
    Chinese: string;
  };
  image: string;
  banner: string;
  rating: string;
  year: string;
  episodes: number;
  description: string;
  tags: string[];
}

export const MOCK_ANIME: Anime[] = [
  {
    id: "1",
    title: {
      English: "Solo Leveling",
      Japanese: "俺だけレベルアップな件",
      Chinese: "我独自升级"
    },
    image: "https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1614728263952-84ea206f9c45?q=80&w=2000&auto=format&fit=crop",
    rating: "9.2",
    year: "2024",
    episodes: 12,
    description: "In a world where hunters must battle deadly monsters to protect mankind, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a struggle for survival.",
    tags: ["Action", "Fantasy", "Adventure"]
  },
  {
    id: "2",
    title: {
      English: "Frieren: Beyond Journey's End",
      Japanese: "葬送のフリーレン",
      Chinese: "葬送的芙莉莲"
    },
    image: "https://images.unsplash.com/photo-1578632738980-43314a514d3b?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop",
    rating: "9.5",
    year: "2023",
    episodes: 28,
    description: "After the party of heroes defeated the Demon King, they restored peace to the land and returned to their lives. The elf mage Frieren, having a much longer life span, begins a new journey.",
    tags: ["Drama", "Fantasy", "Adventure"]
  },
  {
    id: "3",
    title: {
      English: "Jujutsu Kaisen",
      Japanese: "呪術廻戦",
      Chinese: "咒术回战"
    },
    image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2000&auto=format&fit=crop",
    rating: "8.9",
    year: "2023",
    episodes: 24,
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    tags: ["Action", "Supernatural"]
  },
  {
    id: "4",
    title: {
      English: "Oshi No Ko",
      Japanese: "【推しの子】",
      Chinese: "我推的孩子"
    },
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop",
    rating: "9.0",
    year: "2023",
    episodes: 11,
    description: "Dr. Goro is reborn as the son of the young starlet Ai Hoshino after her delusional stalker murders him. Now, he wants to help his mother rise to the top, but what can a child do?",
    tags: ["Drama", "Mystery", "Music"]
  },
  {
    id: "5",
    title: {
      English: "Chainsaw Man",
      Japanese: "チェンソーマン",
      Chinese: "电锯人"
    },
    image: "https://images.unsplash.com/photo-1612178537253-bccd437b730e?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000&auto=format&fit=crop",
    rating: "8.7",
    year: "2022",
    episodes: 12,
    description: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils.",
    tags: ["Action", "Horror", "Supernatural"]
  },
  {
    id: "6",
    title: {
      English: "Spy x Family",
      Japanese: "スパイファミリー",
      Chinese: "间谍过家家"
    },
    image: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=2000&auto=format&fit=crop",
    rating: "8.8",
    year: "2022",
    episodes: 25,
    description: "A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep together.",
    tags: ["Comedy", "Action", "Slice of Life"]
  }
];
