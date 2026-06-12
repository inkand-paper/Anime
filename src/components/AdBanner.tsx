"use client";

import React, { useState, useMemo } from "react";
import { X, Zap, ShoppingBag, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type AdBannerVariant = "leaderboard" | "sidebar" | "banner";

interface AdBannerProps {
  variant?: AdBannerVariant;
  slot?: string;
  className?: string;
}

const ADS = [
  {
    headline: "Upgrade to Premium",
    sub: "Watch new episodes 48h early. Ad-free viewing. Up to 4K HDR.",
    cta: "Try Premium",
    Icon: Zap,
    gradient: "var(--brand-primary), var(--brand-accent)",
  },
  {
    headline: "Anime Merch Store",
    sub: "Official figures, posters and apparel. Limited edition drops weekly.",
    cta: "Shop Now",
    Icon: ShoppingBag,
    gradient: "#ec4899, #f97316",
  },
  {
    headline: "Join our Community",
    sub: "10,000+ anime fans discussing episodes, sharing rankings and more.",
    cta: "Join Discord",
    Icon: MessageCircle,
    gradient: "#5865f2, #4752c4",
  },
];

const HEIGHTS: Record<AdBannerVariant, string> = {
  leaderboard: "h-20",
  sidebar:     "h-56",
  banner:      "h-14",
};

export default function AdBanner({ variant = "leaderboard", slot: _slot, className }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  // Deterministic ad pick per slot/variant so it doesn't re-roll on re-render
  const ad = useMemo(() => ADS[Math.abs(((_slot ?? variant).charCodeAt(0) ?? 0) % ADS.length)], [_slot, variant]);

  if (dismissed) return null;

  const isVertical = variant === "sidebar";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        HEIGHTS[variant],
        className
      )}
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      aria-label="Advertisement"
    >
      {/* Gradient accent strip */}
      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
        style={{ background: `linear-gradient(to bottom, ${ad.gradient})` }}
      />

      <div className={cn("flex h-full px-4 pl-5 gap-4", isVertical ? "flex-col justify-center items-start py-5" : "items-center justify-between")}>
        {/* Left: label + content */}
        <div className={cn("flex items-center gap-3 min-w-0", isVertical ? "flex-col items-start" : "")}>
          {/* Ad label */}
          <span
            className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
          >
            Ad
          </span>

          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${ad.gradient})` }}
            >
              <ad.Icon size={13} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {ad.headline}
              </p>
              {(variant !== "banner") && (
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {ad.sub}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA + dismiss */}
        <div className={cn("flex items-center gap-2 shrink-0", isVertical ? "w-full" : "")}>
          <a
            href="#"
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 whitespace-nowrap",
              isVertical && "flex-1 text-center"
            )}
            style={{ background: `linear-gradient(135deg, ${ad.gradient})` }}
          >
            {ad.cta}
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close ad"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
