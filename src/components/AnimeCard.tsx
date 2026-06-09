"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Anime } from "@/data/anime";
import Link from "next/link";

interface AnimeCardProps { anime: Anime; }

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [isHovered, setIsHovered] = useState(false);

  const isAdded = isInWatchlist(anime.id);
  const isLocked = anime.tags.includes("New Release") && !isPremium;

  const handleCardClick = () => { if (isLocked) openModal(); };

  return (
    <div
      className="relative flex-none w-44 md:w-52"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        zIndex: isHovered ? 50 : 10,
        transform: isHovered ? "scale(1.18) translateY(-8px)" : "scale(1)",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), z-index 0s",
      }}
      onClick={isLocked ? handleCardClick : undefined}
    >
      <div className={`relative rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-300 shadow-xl cursor-pointer
        ${isHovered ? "border-blue-500/60 shadow-blue-500/20 shadow-2xl" : "border-zinc-800"}
        ${isLocked ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "2/3" }}
      >
        {/* Cover image */}
        <img
          src={anime.image}
          alt={anime.title[language]}
          className="w-full h-full object-cover transition-all duration-500"
          style={{ filter: isLocked ? "brightness(0.25) grayscale(0.4)" : isHovered ? "brightness(0.45)" : "brightness(1)" }}
        />

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-white font-black text-xs uppercase tracking-widest">Premium Only</p>
            <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase">Click to unlock</p>
          </div>
        )}

        {/* Rating badge */}
        {!isLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-yellow-400 text-[10px]">★</span>
            <span className="text-white text-[10px] font-bold">{anime.rating}</span>
          </div>
        )}

        {/* New badge */}
        {anime.tags.includes("New Release") && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">New</span>
          </div>
        )}

        {/* Hover info overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent transition-opacity duration-300"
          style={{ opacity: isHovered && !isLocked ? 1 : 0 }}
        >
          <div className="p-4 space-y-2.5">
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
              {anime.title[language]}
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
              <span className="text-green-400">{anime.rating}</span>
              <span>•</span>
              <span>{anime.year}</span>
              <span>•</span>
              <span>{anime.episodes} eps</span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{anime.description}</p>
            <div className="flex gap-2 pt-1">
              <Link
                href={`/watch/${anime.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-grow py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-colors text-center"
              >
                ▶ Watch
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors
                  ${isAdded ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"}`}
                title={isAdded ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isAdded ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Static title — only visible when not hovered */}
        {!isHovered && !isLocked && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-xs font-bold text-white line-clamp-1">{anime.title[language]}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
