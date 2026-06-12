"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useWatchlist } from "@/context/WatchlistContext";
import VideoPlayer from "@/components/VideoPlayer";
import AdBanner from "@/components/AdBanner";
import PremiumModal from "@/components/PremiumModal";
import { VideoSource } from "@/lib/video-resolver";
import { Anime } from "@/data/anime";
import {
  ChevronLeft, Share2, Plus, Check, Star, Film,
  Tv, Lock, AlertTriangle, RotateCcw, MessageSquare,
  Loader2, ChevronRight, Users,
} from "lucide-react";
import WatchTogetherModal from "@/components/WatchTogetherModal";

export default function WatchPage() {
  const { id }     = useParams<{ id: string }>();
  const { language }                                    = useLanguage();
  const { isPremium, isModalOpen, openModal, closeModal } = useSubscription();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [anime,        setAnime]        = useState<Anime | null>(null);
  const [animeLoading, setAnimeLoading] = useState(true);
  const [related,      setRelated]      = useState<Anime[]>([]);

  const [sources,        setSources]        = useState<VideoSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError,   setSourcesError]   = useState("");
  const [episode,        setEpisode]        = useState(1);
  const [watchOpen,      setWatchOpen]      = useState(false);
  const [epPage,         setEpPage]         = useState(0); // episode pagination (100 per page)
  const EP_PER_PAGE = 100;

  const isAdded  = anime ? isInWatchlist(anime.id) : false;
  const isLocked = false; // wire to: anime?.tags.includes("New Release") && !isPremium

  // Fetch anime metadata
  useEffect(() => {
    if (!id) return;
    setAnimeLoading(true);
    setAnime(null);
    fetch(`/api/anime/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Anime) => setAnime(data?.id ? data : null))
      .catch(() => setAnime(null))
      .finally(() => setAnimeLoading(false));
  }, [id]);

  // Related anime (same first genre)
  useEffect(() => {
    if (!anime?.tags?.[0]) return;
    fetch(`/api/anime/search?genre=${encodeURIComponent(anime.tags[0])}&perPage=8`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.results)) {
          setRelated(d.results.filter((a: Anime) => a.id !== id).slice(0, 6));
        }
      })
      .catch(() => {});
  }, [anime, id]);

  // Fetch stream sources
  const fetchSources = useCallback(() => {
    if (!id || isLocked) return;
    setSources([]);
    setSourcesError("");
    setSourcesLoading(true);
    fetch(`/api/anime/${encodeURIComponent(id)}/episode/${episode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources?.length) setSources(data.sources);
        else setSourcesError(data.error ?? "No stream found for this episode.");
      })
      .catch(() => setSourcesError("Failed to reach stream servers. Please try again."))
      .finally(() => setSourcesLoading(false));
  }, [id, episode, isLocked]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  // Share
  const share = async () => {
    const url = window.location.href;
    try { await navigator.share({ title: getTitle(), url }); }
    catch { await navigator.clipboard.writeText(url).catch(() => {}); }
  };

  const getTitle = () =>
    anime?.title?.[language] ?? anime?.title?.English ?? anime?.title?.Romaji ?? "";

  // Episode pagination
  const epStart  = epPage * EP_PER_PAGE + 1;
  const epEnd    = Math.min((epPage + 1) * EP_PER_PAGE, anime?.episodes ?? 0);
  const epPages  = Math.ceil((anime?.episodes ?? 0) / EP_PER_PAGE);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (animeLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!anime) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 text-center p-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          <Film size={32} style={{ color: "var(--text-muted)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Anime not found
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This title may have been removed or the ID is invalid.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          <ChevronLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const title = getTitle();

  return (
    <>
      <div className="min-h-dvh pb-20" style={{ background: "var(--bg-base)" }}>
        <div className="container mx-auto px-4 sm:px-6 pt-4 space-y-5 max-w-screen-2xl">

          {/* Breadcrumb row */}
          <div className="flex items-center justify-between min-h-8">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronLeft size={16} />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWatchOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                <Users size={13} />
                Watch Together
              </button>
              <button
                onClick={share}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                aria-label="Share"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Top leaderboard ad */}
          <AdBanner variant="leaderboard" slot="watch-top" />

          {/* Main two-column layout */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── Main column ────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Player */}
              <div
                className="w-full overflow-hidden rounded-2xl"
                style={{ background: "black", boxShadow: "0 4px 32px rgba(0,0,0,0.6)" }}
              >
                {isLocked ? (
                  /* Paywall */
                  <div
                    className="relative w-full flex flex-col items-center justify-center gap-5 cursor-pointer"
                    style={{ aspectRatio: "16/9", background: "var(--bg-surface)" }}
                    onClick={openModal}
                    role="button"
                    tabIndex={0}
                  >
                    {anime.banner && (
                      <img
                        src={anime.banner}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-15"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                      >
                        <Lock size={22} style={{ color: "var(--brand-primary)" }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                          Premium Content
                        </h3>
                        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                          New releases are available to Premium subscribers 48 hours early.
                        </p>
                      </div>
                      <button
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                        style={{
                          background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                        }}
                      >
                        Unlock Premium
                      </button>
                    </div>
                  </div>
                ) : sourcesLoading ? (
                  /* Loading */
                  <div
                    className="w-full flex flex-col items-center justify-center gap-4"
                    style={{ aspectRatio: "16/9", background: "var(--bg-surface)" }}
                  >
                    <Loader2 size={36} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Finding stream...
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Checking sub, dub, and backup servers
                      </p>
                    </div>
                  </div>
                ) : sourcesError ? (
                  /* Error */
                  <div
                    className="w-full flex flex-col items-center justify-center gap-5 text-center px-8"
                    style={{ aspectRatio: "16/9", background: "var(--bg-surface)" }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <AlertTriangle size={22} style={{ color: "var(--brand-danger)" }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                        Stream unavailable
                      </h3>
                      <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
                        {sourcesError}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        Make sure ANIWATCH_API_URL is set in your environment.
                      </p>
                    </div>
                    <button
                      onClick={fetchSources}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                    >
                      <RotateCcw size={14} />
                      Try again
                    </button>
                  </div>
                ) : (
                  <VideoPlayer
                    sources={sources}
                    title={title}
                    episode={episode}
                    onNext={anime.episodes > episode ? () => setEpisode((e) => e + 1) : undefined}
                  />
                )}
              </div>

              {/* Title bar */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                <div className="space-y-2 min-w-0">
                  {/* Source badges */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{
                        background: "rgba(59,130,246,0.1)",
                        color: "var(--brand-primary)",
                        border: "1px solid rgba(59,130,246,0.2)",
                      }}
                    >
                      Episode {episode}
                    </span>
                    {sources.slice(0, 3).map((s) => (
                      <span
                        key={s.label}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: s.dubbed ? "rgba(139,92,246,0.1)" : "rgba(34,197,94,0.08)",
                          color: s.dubbed ? "#a78bfa" : "#4ade80",
                          border: `1px solid ${s.dubbed ? "rgba(139,92,246,0.2)" : "rgba(34,197,94,0.15)"}`,
                        }}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>

                  <h1
                    className="font-bold leading-tight"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                    }}
                  >
                    {title}
                  </h1>

                  <div
                    className="flex items-center flex-wrap gap-3 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {anime.rating !== "N/A" && (
                      <span className="flex items-center gap-1">
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        {anime.rating}
                      </span>
                    )}
                    {anime.year && <span>{anime.year}</span>}
                    {anime.episodes > 0 && (
                      <span className="flex items-center gap-1">
                        <Tv size={11} />
                        {anime.episodes} episodes
                      </span>
                    )}
                    {anime.studios?.[0] && (
                      <span className="flex items-center gap-1">
                        <Film size={11} />
                        {anime.studios[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => isAdded ? removeFromWatchlist(anime.id) : addToWatchlist(anime)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
                    style={{
                      background: isAdded ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
                      color: isAdded ? "#22c55e" : "var(--text-secondary)",
                      border: `1px solid ${isAdded ? "rgba(34,197,94,0.25)" : "var(--border-default)"}`,
                    }}
                  >
                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                    {isAdded ? "Saved" : "Save"}
                  </button>
                </div>
              </div>

              {/* Episode selector */}
              {anime.episodes > 1 && (
                <div
                  className="rounded-2xl p-4 space-y-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Episodes
                    </h3>

                    {/* Page range selector */}
                    {epPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEpPage((p) => Math.max(0, p - 1))}
                          disabled={epPage === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: epPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setEpPage(i)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                              background: epPage === i ? "var(--brand-primary)" : "var(--bg-elevated)",
                              color: epPage === i ? "white" : "var(--text-muted)",
                            }}
                          >
                            {i * EP_PER_PAGE + 1}–{Math.min((i + 1) * EP_PER_PAGE, anime.episodes)}
                          </button>
                        ))}
                        <button
                          onClick={() => setEpPage((p) => Math.min(epPages - 1, p + 1))}
                          disabled={epPage === epPages - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}
                  >
                    {Array.from({ length: epEnd - epStart + 1 }, (_, i) => epStart + i).map(
                      (ep) => (
                        <button
                          key={ep}
                          onClick={() => {
                            setEpisode(ep);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="h-10 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background:
                              ep === episode ? "var(--brand-primary)" : "var(--bg-elevated)",
                            color: ep === episode ? "white" : "var(--text-secondary)",
                            border: `1px solid ${ep === episode ? "transparent" : "var(--border-subtle)"}`,
                            boxShadow: ep === episode ? "0 2px 12px rgba(59,130,246,0.35)" : "none",
                          }}
                        >
                          {ep}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Genres */}
              {anime.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {anime.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/browse?genre=${encodeURIComponent(tag)}`}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10 hover:text-white"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              {anime.description && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Synopsis
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {anime.description}
                  </p>
                </div>
              )}

              <AdBanner variant="banner" slot="watch-mid" />

              {/* Discussion */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} style={{ color: "var(--brand-primary)" }} />
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Discussion
                  </h3>
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Share your thoughts about this episode..."
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--brand-primary)")}
                    onBlur={(e)  => (e.target.style.borderColor = "var(--border-default)")}
                  />
                  <button
                    className="absolute bottom-3 right-3 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "var(--brand-primary)" }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside
              className="xl:w-72 2xl:w-80 shrink-0 space-y-5"
              aria-label="Sidebar"
            >
              <AdBanner variant="sidebar" slot="watch-sidebar" />

              {related.length > 0 && (
                <div
                  className="rounded-2xl p-4 space-y-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    You may also like
                  </h3>
                  <div className="space-y-2">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={`/watch/${item.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5 group"
                      >
                        <div
                          className="w-14 h-20 rounded-lg overflow-hidden shrink-0"
                          style={{ background: "var(--bg-elevated)" }}
                        >
                          <img
                            src={item.image}
                            alt={item.title.English}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold leading-snug group-hover:text-white transition-colors"
                            style={{
                              color: "var(--text-primary)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.title?.[language] ?? item.title.English}
                          </p>
                          <div
                            className="flex items-center gap-1.5 mt-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {item.rating !== "N/A" && (
                              <span className="flex items-center gap-0.5 text-[11px]">
                                <Star size={9} fill="#f59e0b" color="#f59e0b" />
                                {item.rating}
                              </span>
                            )}
                            {item.year && (
                              <span className="text-[11px]">{item.year}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={closeModal} />
      <WatchTogetherModal isOpen={watchOpen} onClose={() => setWatchOpen(false)} />
    </>
  );
}
