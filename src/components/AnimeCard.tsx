"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Plus, Check, Lock, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Anime } from "@/data/anime";
import { cn } from "@/lib/cn";

interface AnimeCardProps {
  anime: Anime;
  fixed?: boolean;
}

export default function AnimeCard({ anime, fixed = true }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [hovered, setHovered] = useState(false);

  const isAdded  = isInWatchlist(anime.id);
  const isLocked = anime.tags.includes("New Release") && !isPremium;
  const title    = anime.title[language];

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) { e.preventDefault(); openModal(); }
  };

  return (
    <div
      className={cn("relative shrink-0 group", fixed && "w-44 md:w-48")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        zIndex: hovered ? 40 : "auto",
        transform: hovered ? "scale(1.1) translateY(-8px)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <Link href={`/watch/${anime.id}`} onClick={handleClick}>
        {/* Poster */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{ aspectRatio: "2/3", background: "var(--bg-elevated)" }}
        >
          <img
            src={anime.image}
            alt={title}
            className="w-full h-full object-cover"
            style={{
              filter: isLocked ? "brightness(0.25)" : hovered ? "brightness(0.55)" : "brightness(1)",
              transition: "filter 0.3s ease",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Rating badge */}
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          >
            <Star size={10} fill="#f59e0b" color="#f59e0b" />
            <span className="text-[10px] font-bold text-white">{anime.rating}</span>
          </div>

          {/* New badge */}
          {anime.tags.includes("New Release") && (
            <div className="absolute top-2 left-2">
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                New
              </span>
            </div>
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <Lock size={16} color="white" />
              </div>
              <p className="text-white text-[10px] font-bold uppercase tracking-widest">Premium Only</p>
            </div>
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
            style={{
              opacity: hovered && !isLocked ? 1 : 0,
              transition: "opacity 0.2s ease",
              background: "linear-gradient(to top, rgba(3,7,18,0.95) 0%, rgba(3,7,18,0.4) 60%, transparent 100%)",
            }}
          >
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                boxShadow: "var(--shadow-glow-blue)",
              }}
            >
              <Play size={18} fill="white" color="white" />
            </button>

            <button
              onClick={handleWatchlistToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isAdded ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.12)",
                color: isAdded ? "#22c55e" : "white",
                border: `1px solid ${isAdded ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              {isAdded ? <Check size={11} /> : <Plus size={11} />}
              {isAdded ? "Saved" : "Watchlist"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-2 px-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{anime.year}</span>
            <span className="text-xs" style={{ color: "var(--border-strong)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{anime.episodes} eps</span>
          </div>
          <div
            className="flex flex-wrap gap-1 mt-1.5 overflow-hidden"
            style={{
              maxHeight: hovered ? "40px" : "0",
              opacity: hovered ? 1 : 0,
              transition: "max-height 0.3s ease, opacity 0.2s ease",
            }}
          >
            {anime.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
