"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Plus, Check, Lock, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Anime } from "@/data/anime";

interface AnimeCardProps {
  anime: Anime;
}

const CARD_W = 160;
const CARD_H = Math.round(CARD_W * 1.45); // ~2:3 ratio = 232px

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isPremium, openModal } = useSubscription();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAdded  = isInWatchlist(anime.id);
  const isLocked = anime.tags?.includes("New Release") && !isPremium;

  // Safe title access — language context returns "English"|"Japanese"|"Chinese"
  const rawTitle = anime.title;
  const title =
    (rawTitle && typeof rawTitle === "object"
      ? rawTitle[language as keyof typeof rawTitle] ?? rawTitle.English ?? rawTitle.Romaji
      : null) ?? String(anime.id);

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
      className="relative"
      style={{
        width: CARD_W,
        zIndex: hovered ? 40 : "auto",
        transform: hovered ? "scale(1.08) translateY(-6px)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/watch/${anime.id}`} onClick={handleClick} aria-label={`Watch ${title}`}>
        {/* Poster */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            width: CARD_W,
            height: CARD_H,
            background: anime.color ? `${anime.color}22` : "var(--bg-elevated)",
          }}
        >
          {!imgError && anime.image ? (
            <img
              src={anime.image}
              alt={title}
              className="w-full h-full object-cover"
              style={{
                filter: isLocked ? "brightness(0.2)" : hovered ? "brightness(0.45)" : "brightness(1)",
                transition: "filter 0.3s ease",
              }}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center px-2 text-center"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 11 }}
            >
              {title}
            </div>
          )}

          {/* Rating */}
          {!isLocked && anime.rating && anime.rating !== "N/A" && (
            <div
              className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
            >
              <Star size={9} fill="#f59e0b" color="#f59e0b" />
              <span className="text-[10px] font-bold text-white">{anime.rating}</span>
            </div>
          )}

          {/* Airing badge */}
          {anime.status === "RELEASING" && (
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white"
                style={{ background: "var(--brand-primary)" }}>
                Airing
              </span>
            </div>
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <Lock size={20} color="white" />
              <p className="text-white text-[9px] font-bold uppercase tracking-widest">Premium</p>
            </div>
          )}

          {/* Hover overlay */}
          {!isLocked && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
              style={{
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.2s ease",
                background: "linear-gradient(to top, rgba(3,7,18,0.97) 0%, rgba(3,7,18,0.5) 55%, transparent 100%)",
              }}
            >
              {/* Play button */}
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.45)",
                }}
                aria-label={`Play ${title}`}
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
                aria-label={isAdded ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isAdded ? <Check size={10} /> : <Plus size={10} />}
                {isAdded ? "Saved" : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="mt-2 px-0.5" style={{ width: CARD_W }}>
          <p
            className="text-sm font-semibold leading-tight"
            style={{
              color: "var(--text-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {anime.year && (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{anime.year}</span>
            )}
            {anime.episodes > 0 && (
              <>
                <span style={{ color: "var(--border-strong)", fontSize: 8 }}>•</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{anime.episodes} ep</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
