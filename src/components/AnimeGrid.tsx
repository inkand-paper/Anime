"use client";

import React, { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Anime } from "@/data/anime";
import AnimeCard from "./AnimeCard";

interface AnimeGridProps {
  title: string;
  animes: Anime[];
}

export default function AnimeGrid({ title, animes }: AnimeGridProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
          <span
            className="inline-block w-1 h-5 rounded-full"
            style={{ background: "linear-gradient(to bottom, var(--brand-primary), var(--brand-accent))" }}
          />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scroll row */}
      <div
        ref={rowRef}
        className="scroll-row flex gap-4 px-4 sm:px-6 pb-6"
        style={{ paddingBottom: "3rem" }} /* extra bottom padding for hover scale overflow */
      >
        {animes.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} fixed />
        ))}
      </div>
    </section>
  );
}
