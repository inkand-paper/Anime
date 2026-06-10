"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { VideoSource } from "@/lib/video-resolver";

interface VideoPlayerProps {
  sources: VideoSource[];
  title?: string;
  episode?: number;
  onAdComplete?: () => void;
  onNext?: () => void;
}

export default function VideoPlayer({ sources, title, episode, onAdComplete, onNext }: VideoPlayerProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  // Pre-roll ad state
  const [adPlaying, setAdPlaying] = useState(true);
  const [adTimer, setAdTimer] = useState(5);
  const [adSkippable, setAdSkippable] = useState(false);

  // Mid-roll ad
  const [midRollShown, setMidRollShown] = useState(false);
  const [midRollPlaying, setMidRollPlaying] = useState(false);
  const [midRollTimer, setMidRollTimer] = useState(5);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSource = sources[sourceIndex];

  // Pre-roll countdown
  useEffect(() => {
    if (!adPlaying) return;
    if (adTimer <= 0) { setAdSkippable(true); return; }
    const t = setInterval(() => setAdTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [adPlaying, adTimer]);

  // Mid-roll countdown
  useEffect(() => {
    if (!midRollPlaying) return;
    if (midRollTimer <= 0) return;
    const t = setInterval(() => setMidRollTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [midRollPlaying, midRollTimer]);

  // Mid-roll trigger at 30% progress
  useEffect(() => {
    if (!midRollShown && !adPlaying && progress >= 30 && progress < 31) {
      setMidRollShown(true);
      setMidRollPlaying(true);
      setMidRollTimer(5);
      if (videoRef.current) videoRef.current.pause();
    }
  }, [progress, adPlaying, midRollShown]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  const skipAd = () => {
    setAdPlaying(false);
    onAdComplete?.();
    videoRef.current?.play();
  };

  const skipMidRoll = () => {
    setMidRollPlaying(false);
    videoRef.current?.play();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMeta = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleError = () => {
    setHasError(true);
    if (sourceIndex < sources.length - 1) {
      console.log(`[player] ${currentSource.label} failed → trying ${sources[sourceIndex + 1].label}`);
      setTimeout(() => { setSourceIndex((i) => i + 1); setHasError(false); }, 500);
    } else {
      setAllFailed(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const fmt = (s: number) => {
    if (isNaN(s)) return "00:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden group shadow-2xl border border-zinc-800 select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Main content: iframe or video */}
      {currentSource?.type === "iframe" && !adPlaying && !midRollPlaying ? (
        <iframe
          src={currentSource.url}
          className="w-full h-full border-0"
          allowFullScreen
          title={`${title} - Episode ${episode}`}
        />
      ) : (
        <video
          ref={videoRef}
          src={adPlaying || midRollPlaying
            ? "https://www.w3schools.com/html/mov_bbb.mp4"
            : currentSource?.type !== "iframe" ? currentSource?.url : undefined}
          className="w-full h-full object-contain cursor-pointer"
          onClick={adPlaying || midRollPlaying ? undefined : togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMeta}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleError}
          autoPlay
        />
      )}

      {/* All sources failed */}
      {allFailed && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/95 text-center p-8">
          <div className="text-5xl mb-4">📡</div>
          <h4 className="text-2xl font-black text-white mb-2">All sources unavailable</h4>
          <p className="text-zinc-500 max-w-xs text-sm leading-relaxed mb-6">
            All 7 streaming hosts failed to respond. The hosts tried were:{" "}
            {sources.map((s) => s.label).join(", ")}.
          </p>
          <button onClick={() => { setSourceIndex(0); setHasError(false); setAllFailed(false); }}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Pre-roll ad overlay */}
      {adPlaying && (
        <div className="absolute inset-0 z-20 flex flex-col items-end justify-end p-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          {/* Top-right ad badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 glass px-3 py-1.5 rounded-xl pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Ad</span>
          </div>
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <button
              onClick={adSkippable ? skipAd : undefined}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all text-sm ${adSkippable ? "bg-white text-black hover:bg-zinc-200 cursor-pointer" : "bg-black/60 text-zinc-400 cursor-not-allowed"}`}
            >
              {adTimer > 0 ? `Skip in ${adTimer}s` : "Skip Ad →"}
            </button>
          </div>
        </div>
      )}

      {/* Mid-roll ad overlay */}
      {midRollPlaying && (
        <div className="absolute inset-0 z-20 flex flex-col items-end justify-end p-6 bg-black/30 pointer-events-none">
          <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-xl pointer-events-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Mid-roll Ad</span>
          </div>
          <div className="pointer-events-auto">
            <button
              onClick={midRollTimer <= 0 ? skipMidRoll : undefined}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm ${midRollTimer <= 0 ? "bg-white text-black hover:bg-zinc-200 cursor-pointer" : "bg-black/60 text-zinc-400 cursor-not-allowed"}`}
            >
              {midRollTimer > 0 ? `Resume in ${midRollTimer}s` : "Resume →"}
            </button>
          </div>
        </div>
      )}

      {/* Host switcher pills */}
      {!adPlaying && !midRollPlaying && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 max-w-[calc(100%-2rem)]">
          {sources.map((s, i) => (
            <button
              key={s.label}
              onClick={() => { setSourceIndex(i); setHasError(false); setAllFailed(false); }}
              title={`Switch to ${s.label}`}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${i === sourceIndex ? "bg-blue-600 text-white shadow" : "bg-black/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom controls — video only, not iframe */}
      {currentSource?.type !== "iframe" && !adPlaying && !midRollPlaying && (
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300"
          style={{ opacity: showControls ? 1 : 0, background: showControls ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)" : "transparent" }}
        >
          <div className="px-6 pb-5 space-y-3">
            {/* Progress bar */}
            <div className="relative">
              <div
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group/bar"
                onClick={seek}
              >
                <div
                  className="h-full bg-blue-500 rounded-full relative pointer-events-none group-hover/bar:bg-blue-400 transition-colors"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow -mr-1.5 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                  {isPlaying ? (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>

                {/* Next episode */}
                {onNext && (
                  <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors" title="Next episode">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
                  </button>
                )}

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                    {muted || volume === 0 ? (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    )}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                    onChange={changeVolume}
                    className="w-20 h-1 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Time */}
                <span className="text-sm font-bold text-zinc-400 tabular-nums">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-4">
                {title && (
                  <span className="text-sm font-bold text-zinc-300 hidden sm:block truncate max-w-[180px]">
                    {title}{episode ? ` — Ep ${episode}` : ""}
                  </span>
                )}
                <button onClick={toggleFullscreen} className="text-zinc-400 hover:text-white transition-colors" title="Fullscreen">
                  {isFullscreen ? (
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                  ) : (
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
