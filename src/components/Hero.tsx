"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Anime } from "@/data/anime";
import WatchTogetherModal from "./WatchTogetherModal";
import { Play, Check, Plus, Users, Star, Calendar, Tv } from "lucide-react";

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
            className="max-w-2xl space-y-6"
            style={{ 
              opacity: loaded ? 1 : 0, 
              transform: loaded ? "translateY(0)" : "translateY(30px)", 
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" 
            }}
          >
            {/* Badges */}
            <div className="flex items-center gap-4 text-xs font-black tracking-[0.1em] flex-wrap uppercase">
              {anime.tags.includes("New Release") && (
                <span className="text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                  New Release
                </span>
              )}
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-500" />
                {anime.year}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Tv className="w-4 h-4 text-zinc-500" />
                {anime.episodes} Episodes
              </div>
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                <Star className="w-4 h-4 fill-yellow-500" />
                {anime.rating}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
              {anime.title[language]}
            </h1>

            {/* Description */}
            <p className="text-lg text-zinc-400 line-clamp-3 leading-relaxed max-w-xl font-medium">
              {anime.description}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {anime.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-3 py-1.5 border border-white/5 rounded-xl bg-white/[0.03] backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4 pt-4 flex-wrap">
              <a href={`/watch/${anime.id}`}
                className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center gap-3 text-lg shadow-2xl shadow-blue-500/20 group">
                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                Watch Now
              </a>

              <button
                onClick={() => addToWatchlist(anime)}
                disabled={isAdded}
                className={`px-10 py-5 rounded-2xl border-2 font-black transition-all transform active:scale-95 flex items-center gap-3 text-lg
                  ${isAdded 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default" 
                    : "bg-white/5 backdrop-blur-xl text-white border-white/10 hover:bg-white/10 hover:border-white/20 shadow-xl"}`}
              >
                {isAdded ? (
                  <><Check className="w-6 h-6" /> In Watchlist</>
                ) : (
                  <><Plus className="w-6 h-6" /> Watchlist</>
                )}
              </button>

              <button
                onClick={() => setWatchTogetherOpen(true)}
                className="px-8 py-5 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/5 text-indigo-400 font-black transition-all transform active:scale-95 flex items-center gap-3 hover:bg-indigo-500/10 hover:border-indigo-500/50 shadow-xl"
              >
                <Users className="w-6 h-6" />
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
