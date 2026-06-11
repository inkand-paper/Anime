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
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAdded  = isInWatchlist(anime.id);
  const isLocked = anime.tags.includes("New Release") && !isPremium;
  const title    = anime.title?.[language] ?? anime.title?.English ?? anime.title?.Romaji ?? "";

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) { e.preventDefault(); openModal(); }
  };

  // Card dimensions: fixed width for row layout
  const CARD_W = 160;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: CARD_W,
        zIndex: hovered ? 40 : "auto",
        transform: hovered ? "scale(1.08) translateY(-6px)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/watch/${anime.id}`} onClick={handleClick}>
        {/* Poster */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            width: CARD_W,
            height: Math.round(CARD_W * 1.45), // ~2:3 ratio
            background: anime.color
              ? `${anime.color}22`
              : "var(--bg-elevated)",
          }}
        >
          {!imgError ? (
            <img
              src={anime.image}
              alt={title}
              className="w-full h-full object-cover"
              style={{
                filter: isLocked
                  ? "brightness(0.2) grayscale(0.3)"
                  : hovered
                  ? "brightness(0.5)"
                  : "brightness(1)",
                transition: "filter 0.3s ease",
              }}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xs font-semibold text-center px-2"
              style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
            >
              {title}
            </div>
          )}

          {/* Rating badge */}
          {!isLocked && anime.rating !== "N/A" && (
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
              style={{ background: "rgba(0,0,0,0.75)", color: "white", backdropFilter: "blur(4px)" }}
            >
              <Star size={9} fill="#f59e0b" color="#f59e0b" />
              {anime.rating}
            </div>
          )}

          {/* New badge */}
          {anime.status === "RELEASING" && (
            <div className="absolute top-2 left-2">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                Airing
              </span>
            </div>
          )}

          {/* Lock */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
              <Lock size={20} color="white" />
              <p className="text-white text-[9px] font-bold uppercase tracking-widest">Premium</p>
            </div>
          )}

          {/* Hover overlay */}
          {!isLocked && (
            <div
              className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2")}
              style={{
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.2s ease",
                background:
                  "linear-gradient(to top, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.5) 55%, transparent 100%)",
              }}
            >
              {/* Play button */}
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                }}
              >
                <Play size={17} fill="white" color="white" />
              </button>

              {/* Watchlist */}
              <button
                onClick={handleWatchlistToggle}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                style={{
                  background: isAdded ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.12)",
                  color: isAdded ? "#22c55e" : "white",
                  border: `1px solid ${isAdded ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"}`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {isAdded ? <Check size={10} /> : <Plus size={10} />}
                {isAdded ? "Saved" : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* Card info below poster */}
        <div className="mt-2 px-0.5" style={{ width: CARD_W }}>
          <p
            className="text-sm font-semibold leading-tight"
            style={{
              color: "var(--text-primary)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {anime.year}
            </span>
            {anime.episodes > 0 && (
              <>
                <span style={{ color: "var(--border-strong)" }}>·</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {anime.episodes} ep
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
