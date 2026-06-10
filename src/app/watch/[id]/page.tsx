"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_ANIME } from "@/data/anime";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import VideoPlayer from "@/components/VideoPlayer";
import AdBanner from "@/components/AdBanner";
import AnimeCard from "@/components/AnimeCard";
import PremiumModal from "@/components/PremiumModal";
import { resolveVideoSources, VideoSource } from "@/lib/video-resolver";

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { isPremium, isModalOpen, openModal, closeModal } = useSubscription();

  const [sources, setSources] = useState<VideoSource[]>([]);
  const [episode, setEpisode] = useState(1);

  const anime = MOCK_ANIME.find((a) => a.id === id);
  const relatedAnimes = MOCK_ANIME.filter((a) => a.id !== id).slice(0, 6);

  const isLocked = anime?.tags.includes("New Release") && !isPremium;

  useEffect(() => {
    if (id) resolveVideoSources(id as string, episode).then(setSources);
  }, [id, episode]);

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center gap-4">
        <p className="text-4xl">😶</p>
        <h1 className="text-2xl font-black text-white">Anime not found</h1>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-6 py-10 space-y-10">

        {/* Top leaderboard ad */}
        <AdBanner variant="leaderboard" />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main */}
          <div className="lg:w-3/4 space-y-6">

            {/* Player or paywall */}
            {isLocked ? (
              <div
                className="relative w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col items-center justify-center gap-5 cursor-pointer group"
                onClick={openModal}
              >
                <div className="absolute inset-0 opacity-30">
                  <img src={anime.banner} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="relative z-10 text-center space-y-3 px-8">
                  <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white">Premium Content</h3>
                  <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
                    This title is available to Premium subscribers. Upgrade to watch now — no waiting, no ads.
                  </p>
                  <button className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/30">
                    Unlock Premium
                  </button>
                </div>
              </div>
            ) : (
              sources.length > 0 ? (
                <VideoPlayer
                  sources={sources}
                  title={anime.title[language]}
                  episode={episode}
                  onNext={episode < anime.episodes ? () => setEpisode((e) => e + 1) : undefined}
                />
              ) : (
                <div className="w-full aspect-video bg-zinc-950 rounded-3xl border border-zinc-800 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-zinc-600">
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-sm font-bold">Loading sources...</span>
                  </div>
                </div>
              )
            )}

            {/* Episode info */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">{anime.title[language]}</h1>
                <div className="flex items-center gap-3 text-zinc-500 font-bold text-sm mt-1 flex-wrap">
                  <span className="text-blue-400">Episode {episode}</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span>{anime.year}</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span>{anime.episodes} eps total</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span className="text-green-400">★ {anime.rating}</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold rounded-xl border border-zinc-800 text-sm transition-colors shrink-0">
                Report Issue
              </button>
            </div>

            {/* Episode selector */}
            {anime.episodes > 1 && (
              <div>
                <h3 className="text-base font-black text-zinc-400 uppercase tracking-widest mb-3">Episodes</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(anime.episodes, 48) }, (_, i) => i + 1).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => setEpisode(ep)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${ep === episode ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"}`}
                    >
                      {ep}
                    </button>
                  ))}
                  {anime.episodes > 48 && (
                    <span className="w-10 h-10 flex items-center justify-center text-zinc-700 text-sm font-bold">+{anime.episodes - 48}</span>
                  )}
                </div>
              </div>
            )}

            <p className="text-zinc-400 leading-relaxed max-w-4xl">{anime.description}</p>

            {/* Banner ad between player and comments */}
            <AdBanner variant="banner" />

            {/* Comments placeholder */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-5">
              <h3 className="text-xl font-black text-white">Community Discussion</h3>
              <div className="relative">
                <textarea
                  placeholder="What did you think of this episode?"
                  className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium"
                />
                <button className="absolute bottom-4 right-4 px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors text-sm">
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-6">
            {/* Sidebar ad */}
            <AdBanner variant="sidebar" />

            <h3 className="text-lg font-black text-white">More Like This</h3>
            <div className="space-y-10">
              {relatedAnimes.map((item) => (
                <div key={item.id} className="transform scale-90 origin-top-left -mb-12">
                  <AnimeCard anime={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
