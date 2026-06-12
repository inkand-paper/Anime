"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight,
  TrendingUp, Flame, Star, Tv, Film,
} from "lucide-react";
import { Anime } from "@/data/anime";
import AnimeCard from "./AnimeCard";

const ICON_MAP = {
  trending: TrendingUp,
  flame:    Flame,
  star:     Star,
  tv:       Tv,
  film:     Film,
} as const;

type IconKey = keyof typeof ICON_MAP;

interface AnimeGridProps {
  title: string;
  animes: Anime[];
  icon?: IconKey;
  viewAllHref?: string;
}

export default function AnimeGrid({ title, animes, icon, viewAllHref }: AnimeGridProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const width = rowRef.current.clientWidth;
    rowRef.current.scrollBy({ left: dir === "right" ? width * 0.75 : -(width * 0.75), behavior: "smooth" });
  };

  if (!animes.length) return null;

  const Icon = icon ? ICON_MAP[icon] : null;

  return (
    <section className="py-4">
      {/* Section header */}
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between mb-3">
        <h2
          className="flex items-center gap-2 text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {Icon && <Icon size={15} style={{ color: "var(--brand-primary)" }} />}
          {title}
        </h2>
        <div className="flex items-center gap-1.5">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-semibold mr-2 transition-colors hover:text-white"
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
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={rowRef}
        className="scroll-row"
        style={{
          paddingLeft:  "clamp(1rem, 4vw, 1.5rem)",
          paddingRight: "clamp(1rem, 4vw, 1.5rem)",
          paddingBottom: "3.5rem", // Space for hover scale-up overflow
        }}
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
