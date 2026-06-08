"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Anime } from "@/data/anime";
import { Lock } from "lucide-react";

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [isHovered, setIsHovered] = useState(false);

  const isAdded = isInWatchlist(anime.id);
  const isLocked = anime.tags.includes("New Release") && !isPremium;

  return (
    <div 
      className={`relative flex-none w-48 md:w-64 h-[28rem] transition-all duration-500 ease-out z-10 ${isLocked ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isLocked && openModal()}
      style={{
        zIndex: isHovered ? 50 : 10,
        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
      }}
    >
      <div className={`absolute inset-0 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-500 shadow-2xl ${isHovered ? 'ring-4 ring-blue-500/50' : ''}`}>
        {/* Main Image */}
        <div className="relative w-full h-full">
          <img 
            src={anime.image} 
            alt={anime.title[language]} 
            className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'brightness-[0.3] grayscale-[0.5]' : ''}`}
          />
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-black text-sm uppercase tracking-widest">Premium Only</p>
              <p className="text-zinc-500 text-[10px] font-bold mt-1 uppercase">Available to free users in 2 days</p>
            </div>
          )}
        </div>

        {/* Overlay when hovered */}
        <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-0 p-4 space-y-3 w-full">
            <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
              {anime.title[language]}
            </h3>
            
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-green-500">{anime.rating}</span>
              <span className="text-zinc-400">{anime.year}</span>
              <span className="text-zinc-400">{anime.episodes} eps</span>
            </div>

            <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">
              {anime.description}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button className="flex-grow py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                Watch
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors group ${isAdded ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'}`}
              >
                {isAdded ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                ) : (
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Static Title (Visible when not hovered) */}
        {!isHovered && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-sm font-bold text-white line-clamp-1">
              {anime.title[language]}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
