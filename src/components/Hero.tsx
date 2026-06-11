"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Plus, Check, Star, Film, Users } from "lucide-react";
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

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const isAdded = isInWatchlist(anime.id);
  const title   = anime.title[language];

  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ height: "88vh", minHeight: 560 }}>
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={anime.banner}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            style={{
              transform: mounted ? "scale(1.06)" : "scale(1)",
              transition: "transform 12s ease-out",
              filter: "brightness(0.45)",
            }}
          />
          {/* Gradient overlays */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, rgba(3,7,18,0.95) 0%, rgba(3,7,18,0.6) 45%, rgba(3,7,18,0.1) 80%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(3,7,18,1) 0%, rgba(3,7,18,0.4) 30%, transparent 60%)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6">
            <div
              className="max-w-2xl space-y-5"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(28px)",
                transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  <Star size={11} fill="#f59e0b" />
                  {anime.rating}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: "rgba(59,130,246,0.15)", color: "var(--brand-primary)", border: "1px solid rgba(59,130,246,0.3)" }}
                >
                  <Film size={11} />
                  {anime.episodes} Episodes
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  {anime.year}
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-4xl sm:text-6xl font-black leading-none tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {anime.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-base leading-relaxed max-w-xl line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                {anime.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Link
                  href={`/watch/${anime.id}`}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90"
                  style={{ background: "var(--text-primary)", color: "var(--text-inverted)" }}
                >
                  <Play size={18} fill="currentColor" />
                  Watch Now
                </Link>

                <button
                  onClick={() => isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime)}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-base transition-all hover:bg-white/15"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: isAdded ? "#22c55e" : "var(--text-primary)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {isAdded ? <Check size={17} /> : <Plus size={17} />}
                  {isAdded ? "In Watchlist" : "Add to Watchlist"}
                </button>

                <button
                  onClick={() => setWatchOpen(true)}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Users size={16} />
                  Watch Together
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WatchTogetherModal isOpen={watchOpen} onClose={() => setWatchOpen(false)} />
    </>
  );
}
