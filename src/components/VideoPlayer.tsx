"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Play, Pause, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, Settings, AlertCircle,
  Loader2, Captions, CaptionsOff,
} from "lucide-react";
import { VideoSource } from "@/lib/video-resolver";
import { cn } from "@/lib/cn";

interface VideoPlayerProps {
  sources: VideoSource[];
  title?: string;
  episode?: number;
  onNext?: () => void;
}

function fmtTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoPlayer({
  sources,
  title,
  episode,
  onNext,
}: VideoPlayerProps) {
  const [srcIdx, setSrcIdx]           = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [buffering, setBuffering]     = useState(true);
  const [progress, setProgress]       = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(1);
  const [muted, setMuted]             = useState(false);
  const [showUI, setShowUI]           = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allFailed, setAllFailed]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subsOn, setSubsOn]           = useState(true);

  // Pre-roll ad
  const [adActive, setAdActive]       = useState(false);
  const [adTimer, setAdTimer]         = useState(5);
  const [adSkippable, setAdSkippable] = useState(false);

  // Mid-roll
  const [midDone, setMidDone]         = useState(false);
  const [midActive, setMidActive]     = useState(false);
  const [midTimer, setMidTimer]       = useState(5);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef       = useRef<Hls | null>(null);
  const progressRef  = useRef<HTMLDivElement>(null);
  const hideRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const src = sources[srcIdx] ?? null;

  // ── Teardown HLS ──────────────────────────────────────────────────────────
  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  // ── Init video source ─────────────────────────────────────────────────────
  const initSource = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !src || src.type === "iframe") return;

    destroyHls();
    setBuffering(true);
    setIsPlaying(false);

    if (src.type === "hls") {
      // Route through our Next.js proxy so CORS / referer headers are handled
      const proxyUrl =
        `/api/proxy/video?url=${encodeURIComponent(src.url)}` +
        `&referer=${encodeURIComponent("https://allanime.day/")}`;

      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          maxBufferLength: 30,
          backBufferLength: 30,
        });
        hls.loadSource(proxyUrl);
        hls.attachMedia(vid);
        hls.once(Hls.Events.MANIFEST_PARSED, () => {
          vid.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.warn(`[VideoPlayer] HLS fatal error on "${src.label}":`, data.type);
            tryNext();
          }
        });
        hlsRef.current = hls;
      } else if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari: native HLS, no proxy needed for direct playback
        vid.src = src.url;
        vid.play().catch(() => {});
      } else {
        tryNext();
      }
    } else {
      // MP4 direct
      vid.src = src.url;
      vid.play().catch(() => {});
    }
  }, [src, srcIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!adActive && !midActive) initSource();
    return destroyHls;
  }, [initSource, adActive, midActive, destroyHls]);

  // ── Pre-roll countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (!adActive) return;
    const t = setInterval(() => {
      setAdTimer((c) => {
        if (c <= 1) { clearInterval(t); setAdSkippable(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [adActive]);

  // ── Mid-roll at 30 % ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!midDone && !adActive && progress >= 30 && duration > 0) {
      setMidDone(true);
      setMidActive(true);
      setMidTimer(5);
      videoRef.current?.pause();
    }
  }, [progress, midDone, adActive, duration]);

  useEffect(() => {
    if (!midActive) return;
    const t = setInterval(() => {
      setMidTimer((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [midActive]);

  // ── Auto-hide controls ────────────────────────────────────────────────────
  const resetHide = useCallback(() => {
    setShowUI(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    if (isPlaying) {
      hideRef.current = setTimeout(() => setShowUI(false), 3000);
    }
  }, [isPlaying]);

  // ── Fallback to next source ───────────────────────────────────────────────
  const tryNext = useCallback(() => {
    const next = srcIdx + 1;
    if (next < sources.length) {
      setSrcIdx(next);
    } else {
      setAllFailed(true);
    }
  }, [srcIdx, sources.length]);

  // ── Video events ──────────────────────────────────────────────────────────
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
  };
  const onLoadedMeta = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
    setBuffering(false);
  };
  const onWaiting  = () => setBuffering(true);
  const onPlaying  = () => { setIsPlaying(true); setBuffering(false); };
  const onPause    = () => setIsPlaying(false);
  const onError    = () => tryNext();
  const onEnded    = () => { setIsPlaying(false); onNext?.(); };

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  };

  // ── Volume ────────────────────────────────────────────────────────────────
  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  // ── Play / pause ──────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play().catch(() => {});
  };

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };
  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!containerRef.current) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "ArrowRight":
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        case "ArrowLeft":
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isPlaying, muted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Subtitle toggling via textTracks ──────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach((t) => {
      t.mode = subsOn ? "showing" : "hidden";
    });
  }, [subsOn]);

  // ─────────────────────────────────────────────────────────────────────────
  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none outline-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHide}
      onMouseLeave={() => isPlaying && setShowUI(false)}
      tabIndex={0}
      aria-label={title ? `Video: ${title}` : "Video player"}
    >
      {/* ── IFRAME embed ──────────────────────────────────────────────── */}
      {src.type === "iframe" && !adActive && !midActive ? (
        <iframe
          key={src.url}
          src={src.url}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          title={title ?? "Video"}
        />
      ) : (
        /* ── HTML5 video ────────────────────────────────────────────── */
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMeta}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onPause={onPause}
          onError={onError}
          onEnded={onEnded}
          onClick={adActive || midActive ? undefined : togglePlay}
          playsInline
          crossOrigin="anonymous"
          style={{ cursor: adActive || midActive ? "default" : "pointer" }}
        >
          {src.tracks?.map((t, i) => (
            <track
              key={i}
              kind={t.kind as "subtitles" | "captions"}
              src={t.file}
              label={t.label ?? `Track ${i + 1}`}
              default={i === 0}
            />
          ))}
        </video>
      )}

      {/* ── Buffering spinner ────────────────────────────────────────── */}
      {buffering && !allFailed && src.type !== "iframe" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 size={42} className="animate-spin" color="rgba(255,255,255,0.8)" />
        </div>
      )}

      {/* ── All sources failed ───────────────────────────────────────── */}
      {allFailed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8"
          style={{ background: "rgba(3,7,18,0.97)" }}
        >
          <AlertCircle size={40} style={{ color: "var(--brand-danger)" }} />
          <div>
            <p className="text-white font-bold text-lg mb-1">Playback failed</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              All {sources.length} source{sources.length !== 1 ? "s" : ""} failed:&nbsp;
              {sources.map((s) => s.label).join(", ")}
            </p>
          </div>
          <button
            onClick={() => { setSrcIdx(0); setAllFailed(false); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* ── Pre-roll ad overlay ──────────────────────────────────────── */}
      {adActive && (
        <div
          className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
        >
          <span
            className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider"
            style={{ background: "rgba(245,158,11,0.9)", color: "#000" }}
          >
            Ad
          </span>
          <button
            onClick={adSkippable ? () => setAdActive(false) : undefined}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              adSkippable
                ? "bg-white text-black hover:bg-zinc-200 cursor-pointer"
                : "bg-white/15 text-white/50 cursor-not-allowed"
            )}
          >
            {adSkippable ? "Skip Ad" : `Skip in ${adTimer}s`}
          </button>
        </div>
      )}

      {/* ── Mid-roll ad overlay ──────────────────────────────────────── */}
      {midActive && (
        <div
          className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
        >
          <span
            className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider"
            style={{ background: "rgba(245,158,11,0.9)", color: "#000" }}
          >
            Ad
          </span>
          <button
            onClick={
              midTimer <= 0
                ? () => { setMidActive(false); videoRef.current?.play().catch(() => {}); }
                : undefined
            }
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              midTimer <= 0
                ? "bg-white text-black hover:bg-zinc-200 cursor-pointer"
                : "bg-white/15 text-white/50 cursor-not-allowed"
            )}
          >
            {midTimer > 0 ? `Resume in ${midTimer}s` : "Resume"}
          </button>
        </div>
      )}

      {/* ── Source switcher ──────────────────────────────────────────── */}
      {!adActive && !midActive && sources.length > 1 && (
        <div
          className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-5rem)] transition-opacity duration-200"
          style={{ opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none" }}
        >
          {sources.map((s, i) => (
            <button
              key={i}
              onClick={() => { setSrcIdx(i); setAllFailed(false); }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: i === srcIdx ? "var(--brand-primary)" : "rgba(0,0,0,0.65)",
                color: i === srcIdx ? "white" : "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Controls overlay (video only) ───────────────────────────── */}
      {src.type !== "iframe" && !adActive && !midActive && !allFailed && (
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col transition-opacity duration-200"
          style={{
            opacity: showUI ? 1 : 0,
            pointerEvents: showUI ? "auto" : "none",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
          }}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="w-full cursor-pointer group px-4"
            style={{ paddingTop: 14, paddingBottom: 10 }}
            onClick={seek}
          >
            <div
              className="relative w-full rounded-full"
              style={{ height: 3, background: "rgba(255,255,255,0.18)" }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "var(--brand-primary)",
                  transition: "width 0.1s linear",
                }}
              />
              {/* Scrubber handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
          </div>

          {/* Button row */}
          <div className="flex items-center justify-between px-4 pb-3 gap-2">
            {/* Left cluster */}
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying
                  ? <Pause size={20} fill="white" />
                  : <Play  size={20} fill="white" />}
              </button>

              {/* Next */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  aria-label="Next episode"
                >
                  <SkipForward size={18} />
                </button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0
                    ? <VolumeX size={17} />
                    : <Volume2 size={17} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={onVolumeChange}
                  className="w-20 h-1 cursor-pointer hidden sm:block"
                  style={{ accentColor: "var(--brand-primary)" }}
                  aria-label="Volume"
                />
              </div>

              {/* Time */}
              <span
                className="text-xs font-mono hidden sm:inline tabular-nums"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {fmtTime(currentTime)} / {fmtTime(duration)}
              </span>
            </div>

            {/* Center: title */}
            {(title || episode) && (
              <p
                className="text-xs font-medium truncate max-w-[30%] hidden md:block"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {title}
                {episode != null ? ` — Ep. ${episode}` : ""}
              </p>
            )}

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              {/* Subtitle toggle */}
              {src.tracks && src.tracks.length > 0 && (
                <button
                  onClick={() => setSubsOn((v) => !v)}
                  className="transition-colors hover:text-white"
                  style={{ color: subsOn ? "var(--brand-primary)" : "rgba(255,255,255,0.5)" }}
                  aria-label={subsOn ? "Hide subtitles" : "Show subtitles"}
                >
                  {subsOn ? <Captions size={17} /> : <CaptionsOff size={17} />}
                </button>
              )}

              {/* Settings stub */}
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                className="transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>

              {settingsOpen && (
                <div
                  className="absolute bottom-12 right-12 w-44 rounded-xl py-1.5 shadow-2xl"
                  style={{
                    background: "rgba(15,23,42,0.98)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <p
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Quality
                  </p>
                  {sources.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setSrcIdx(i); setSettingsOpen(false); setAllFailed(false); }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10"
                      style={{ color: i === srcIdx ? "var(--brand-primary)" : "rgba(255,255,255,0.7)" }}
                    >
                      {s.label}
                      {i === srcIdx && " (active)"}
                    </button>
                  ))}
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
