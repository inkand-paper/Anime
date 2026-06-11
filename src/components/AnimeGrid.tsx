"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Star, Tv, Film } from "lucide-react";
import { Anime } from "@/data/anime";
import AnimeCard from "./AnimeCard";

const ICONS = {
  trending: TrendingUp,
  flame:    Flame,
  star:     Star,
  tv:       Tv,
  film:     Film,
};

interface AnimeGridProps {
  title: string;
  animes: Anime[];
  icon?: keyof typeof ICONS;
  viewAllHref?: string;
}

export default function AnimeGrid({ title, animes, icon, viewAllHref }: AnimeGridProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  const Icon = icon ? ICONS[icon] : null;

  if (!animes.length) return null;

  return (
    <section className="py-6">
      {/* Section header */}
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between mb-4">
        <h2
          className="flex items-center gap-2.5 text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {Icon && (
            <Icon
              size={16}
              style={{ color: "var(--brand-primary)" }}
            />
          )}
          {title}
        </h2>

        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-semibold transition-colors hover:text-white mr-2"
              style={{ color: "var(--text-muted)" }}
            >
              View all
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={rowRef}
        className="scroll-row"
        style={{ paddingLeft: "clamp(1rem, 4vw, 1.5rem)", paddingRight: "clamp(1rem, 4vw, 1.5rem)", paddingBottom: "3rem" }}
      >
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>
    </section>
  );
}
