"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MOCK_ANIME } from "@/data/anime";
import { useLanguage } from "@/context/LanguageContext";
import VideoPlayer from "@/components/VideoPlayer";
import AdBanner from "@/components/AdBanner";
import AnimeCard from "@/components/AnimeCard";
import { resolveVideoSources, VideoSource } from "@/lib/video-resolver";

export default function WatchPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const [sources, setSources] = React.useState<VideoSource[]>([]);
  
  const anime = MOCK_ANIME.find(a => a.id === id);
  const relatedAnimes = MOCK_ANIME.filter(a => a.id !== id).slice(0, 5);

  React.useEffect(() => {
    if (id) {
        resolveVideoSources(id as string, 1).then(setSources);
    }
  }, [id]);

  if (!anime) return <div className="p-20 text-center text-white font-bold">Anime not found</div>;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="lg:w-3/4 space-y-8">
          <div className="space-y-4">
            {sources.length > 0 && <VideoPlayer sources={sources} />}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white">{anime.title[language as keyof typeof anime.title]}</h1>

                <div className="flex items-center gap-4 text-zinc-500 font-bold text-sm">
                  <span>EP 12</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                  <span className="text-blue-500">{anime.tags.join(", ")}</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                  <span>{anime.year}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-800 transition-colors">
                  Report File
                </button>
              </div>
            </div>
            <p className="text-zinc-400 font-medium leading-relaxed max-w-4xl">
              {anime.description[language]}
            </p>
          </div>

          <AdBanner />

          {/* Comment Section (Placeholder for aesthetic) */}
          <div className="space-y-8 bg-zinc-900/30 p-10 rounded-[40px] border border-zinc-800">
            <h3 className="text-2xl font-black text-white">Community Discussion</h3>
            <div className="relative">
                <textarea 
                    placeholder="Wanna say something about this episode?" 
                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium"
                ></textarea>
                <button className="absolute bottom-4 right-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors">
                    Post
                </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/4 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white capitalize">Up Next</h3>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">More Like This</span>
          </div>
          <div className="space-y-12 h-[1200px] overflow-y-auto no-scrollbar pb-20">
            {relatedAnimes.map((item) => (
                <div key={item.id} className="scale-[0.85] origin-top-left -mb-16">
                    <AnimeCard anime={item} />
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
