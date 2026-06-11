"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Plus, Check, Star, Film, Users, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { Anime } from "@/data/anime";
import WatchTogetherModal from "./WatchTogetherModal";

interface HeroProps { anime: Anime; }

export default function Hero({ anime }: HeroProps) {
  const { language } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [watchOpen, setWatchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const isAdded = isInWatchlist(anime.id);
  const title   = anime.title?.[language] ?? anime.title?.English ?? anime.title?.Romaji ?? "";
  const banner  = anime.banner || anime.image;

  return (
    <>
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "min(88vh, 680px)", minHeight: 480 }}
        aria-label={`Featured anime: ${title}`}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          {banner && (
            <img
              src={banner}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center"
              style={{
                transform: mounted ? "scale(1.04)" : "scale(1)",
                transition: "transform 10s ease-out",
                filter: "brightness(0.42)",
              }}
            />
          )}
          {/* Gradient overlays */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.7) 40%, rgba(3,7,18,0.15) 75%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--bg-base) 0%, rgba(3,7,18,0.5) 25%, transparent 55%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6">
            <div
              className="max-w-xl lg:max-w-2xl space-y-4"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Meta badges */}
              <div className="flex items-center flex-wrap gap-2">
                {anime.studios[0] && (
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {anime.studios[0]}
                  </span>
                )}
                {anime.studios[0] && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>}
                {anime.rating !== "N/A" && (
                  <span
                    className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    <Star size={10} fill="#f59e0b" />
                    {anime.rating}
                  </span>
                )}
                {anime.format && (
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "var(--brand-primary)",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    <Film size={10} />
                    {anime.format.replace("_", " ")}
                  </span>
                )}
                {anime.year && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {anime.year}
                  </span>
                )}
                {anime.episodes > 0 && (
                  <>
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {anime.episodes} episodes
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-black leading-tight tracking-tight"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                }}
              >
                {title}
              </h1>

              {/* Genres */}
              {anime.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5">
                  {anime.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {anime.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "var(--text-secondary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: "42ch",
                  }}
                >
                  {anime.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center flex-wrap gap-2.5 pt-1">
                {/* Watch Now */}
                <Link
                  href={`/watch/${anime.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "var(--text-primary)", color: "var(--text-inverted)" }}
                >
                  <Play size={16} fill="currentColor" />
                  Watch Now
                </Link>

                {/* Watchlist */}
                <button
                  onClick={() =>
                    isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime)
                  }
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/15 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: isAdded ? "#22c55e" : "var(--text-primary)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {isAdded ? <Check size={15} /> : <Plus size={15} />}
                  {isAdded ? "In Watchlist" : "Add to Watchlist"}
                </button>

                {/* Watch Together */}
                <button
                  onClick={() => setWatchOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 active:scale-95 hidden sm:flex"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Users size={15} />
                  Watch Together
                </button>

                {/* Info */}
                <Link
                  href={`/watch/${anime.id}`}
                  className="w-11 h-11 flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text-secondary)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  aria-label="More info"
                >
                  <Info size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WatchTogetherModal isOpen={watchOpen} onClose={() => setWatchOpen(false)} />
    </>
  );
}
