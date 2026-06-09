"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Anime } from "@/data/anime";
import WatchTogetherModal from "./WatchTogetherModal";

interface HeroProps { anime: Anime; }

export default function Hero({ anime }: HeroProps) {
  const { language } = useLanguage();
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  const [watchTogetherOpen, setWatchTogetherOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const isAdded = isInWatchlist(anime.id);

  return (
    <>
      <div className="relative w-full h-[85vh] lg:h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={anime.banner}
            alt={anime.title[language]}
            className="w-full h-full object-cover object-top scale-105 transition-transform duration-[20000ms]"
            style={{ transform: loaded ? "scale(1.08)" : "scale(1.0)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div
            className="max-w-2xl space-y-5"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(24px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Badges */}
            <div className="flex items-center gap-3 text-sm font-bold tracking-wider flex-wrap">
              {anime.tags.includes("New Release") && (
                <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase text-xs">
                  New Release
                </span>
              )}
              <span className="text-zinc-300">{anime.year}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">{anime.episodes} Episodes</span>
              <span className="text-zinc-600">•</span>
              <span className="text-green-400 font-black">★ {anime.rating}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight break-words">
              {anime.title[language]}
            </h1>

            {/* Description */}
            <p className="text-lg text-zinc-300 line-clamp-3 leading-relaxed max-w-xl">
              {anime.description}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {anime.tags.map((tag) => (
                <span key={tag} className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-1 border border-zinc-800 rounded-lg bg-zinc-900/50">
                  {tag}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <a href={`/watch/${anime.id}`}
                className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center gap-2 text-lg shadow-xl shadow-white/10">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch Now
              </a>

              <button
                onClick={() => addToWatchlist(anime)}
                disabled={isAdded}
                className={`px-8 py-4 rounded-xl border font-bold transition-all transform active:scale-95 flex items-center gap-2 text-lg
                  ${isAdded ? "bg-zinc-800 border-zinc-700 text-green-400 cursor-default" : "bg-zinc-800/80 backdrop-blur-md text-white border-zinc-700 hover:bg-zinc-700"}`}
              >
                {isAdded ? (
                  <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg> In Watchlist</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add to Watchlist</>
                )}
              </button>

              <button
                onClick={() => setWatchTogetherOpen(true)}
                className="px-6 py-4 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 font-bold transition-all transform active:scale-95 flex items-center gap-2 hover:bg-purple-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Watch Together
              </button>
            </div>
          </div>
        </div>
      </div>

      <WatchTogetherModal isOpen={watchTogetherOpen} onClose={() => setWatchTogetherOpen(false)} />
    </>
  );
}
