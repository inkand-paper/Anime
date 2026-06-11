"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Anime } from "@/data/anime";
import Link from "next/link";
import { Lock, Star, Play, Check, Plus } from "lucide-react";

interface AnimeCardProps { anime: Anime; }

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [isHovered, setIsHovered] = useState(false);

  const isAdded = isInWatchlist(anime.id);
  // Temporarily disabled for testing
  const isLocked = false; 
  // const isLocked = anime.tags.includes("New Release") && !isPremium;

  const handleCardClick = () => { if (isLocked) openModal(); };

  return (
    <div
      className="relative flex-none w-44 md:w-52"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        zIndex: isHovered ? 50 : 10,
        transform: isHovered ? "scale(1.18) translateY(-8px)" : "scale(1)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), z-index 0s",
      }}
      onClick={isLocked ? handleCardClick : undefined}
    >
      <div className={`relative rounded-3xl overflow-hidden bg-zinc-950 border-2 transition-all duration-500 shadow-2xl cursor-pointer
        ${isHovered ? "border-blue-500/50 shadow-blue-500/10" : "border-white/5"}
        ${isLocked ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "2/3" }}
      >
        {/* Cover image */}
        <img
          src={anime.image}
          alt={anime.title[language]}
          className="w-full h-full object-cover transition-all duration-700"
          style={{ filter: isLocked ? "brightness(0.2) blur(2px)" : isHovered ? "brightness(0.35) scale(1.05)" : "brightness(1)" }}
        />

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 mb-4 shadow-2xl">
              <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-white font-black text-xs uppercase tracking-[0.2em] drop-shadow-lg">Premium</p>
            <p className="text-zinc-500 text-[9px] font-black mt-2 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Unlock Access</p>
          </div>
        )}

        {/* Rating badge */}
        {!isLocked && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-white text-[11px] font-black">{anime.rating}</span>
          </div>
        )}

        {/* New badge */}
        {anime.tags.includes("New Release") && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider shadow-lg shadow-blue-600/30">New</span>
          </div>
        )}

        {/* Hover info overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent transition-opacity duration-300"
          style={{ opacity: isHovered && !isLocked ? 1 : 0 }}
        >
          <div className="p-5 space-y-3">
            <h3 className="text-sm font-black text-white line-clamp-2 leading-tight uppercase tracking-tight">
              {anime.title[language]}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <span className="text-emerald-400 p-1 bg-emerald-500/10 rounded">{anime.rating}</span>
              <span>•</span>
              <span className="p-1 bg-white/5 rounded">{anime.year}</span>
              <span>•</span>
              <span className="p-1 bg-white/5 rounded">{anime.episodes} EP</span>
            </div>
            
            <div className="flex gap-2.5 pt-2">
              <Link
                href={`/watch/${anime.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-grow py-3 bg-white text-black text-[11px] font-black rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                PLAY
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
                }}
                className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all
                  ${isAdded 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                title={isAdded ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Static title — only visible when not hovered */}
        {!isHovered && !isLocked && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1 opacity-90">{anime.title[language]}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
