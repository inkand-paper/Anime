"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { VideoSource } from "@/lib/video-resolver";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw,
  Settings,
  Info,
  Zap,
  AlertCircle,
  Loader2
} from "lucide-react";

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
  const [buffering, setBuffering] = useState(false);

  // Pre-roll ad state
  const [adPlaying, setAdPlaying] = useState(false);
  const [adTimer, setAdTimer] = useState(10);
  const [adSkippable, setAdSkippable] = useState(false);

  // Mid-roll ad
  const [midRollShown, setMidRollShown] = useState(false);
  const [midRollPlaying, setMidRollPlaying] = useState(false);
  const [midRollTimer, setMidRollTimer] = useState(10);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSource = sources[sourceIndex];

  // Initialize HLS
  const initPlayer = useCallback(() => {
    if (!videoRef.current || !currentSource || currentSource.type === "iframe") return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (currentSource.type === "hls") {
      const proxiedUrl = `/api/proxy/video?url=${encodeURIComponent(currentSource.url)}`;
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hls.loadSource(proxiedUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!adPlaying && !midRollPlaying) videoRef.current?.play();
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) handleError();
        });
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = currentSource.url;
      }
    } else {
      videoRef.current.src = currentSource.url;
    }
  }, [currentSource, adPlaying, midRollPlaying]);

  useEffect(() => {
    // Reset states when switching sources
    setBuffering(false);
    setHasError(false);

    if (!adPlaying && !midRollPlaying) {
      initPlayer();
    }
    
    // Watchdog for iframes (standard onError doesn't reliably trigger for iframes)
    let iframeTimeout: ReturnType<typeof setTimeout>;
    if (currentSource?.type === "iframe" && !adPlaying && !midRollPlaying) {
      // For iframes, we assume it's loading successfully unless reported
      setBuffering(false); 
      
      iframeTimeout = setTimeout(() => {
        // Watchdog logic...
      }, 10000);
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (iframeTimeout) clearTimeout(iframeTimeout);
    };
  }, [initPlayer, adPlaying, midRollPlaying, currentSource]);

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

  // Mid-roll trigger at 40% progress
  useEffect(() => {
    if (!midRollShown && !adPlaying && progress >= 40 && progress < 41) {
      setMidRollShown(true);
      setMidRollPlaying(true);
      setMidRollTimer(10);
      if (videoRef.current) videoRef.current.pause();
    }
  }, [progress, adPlaying, midRollShown]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  const skipAd = () => {
    setAdPlaying(false);
    onAdComplete?.();
  };

  const skipMidRoll = () => {
    setMidRollPlaying(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); }
    else { videoRef.current.play(); }
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
      setTimeout(() => { 
        setSourceIndex((i) => i + 1); 
        setHasError(false);
      }, 1000);
    } else {
      setAllFailed(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || adPlaying || midRollPlaying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
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
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const adVideo = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-[32px] overflow-hidden group shadow-2xl border border-white/5 select-none"
      onMouseMove={resetHideTimer}
    >
      {/* Loading/Buffering overlay */}
      {(buffering || (sourceIndex > 0 && hasError)) && !allFailed && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">
              {hasError ? "Switching Source..." : "Buffering..."}
            </p>
          </div>
        </div>
      )}

      {/* Main content: iframe or video */}
      {currentSource?.type === "iframe" && !adPlaying && !midRollPlaying ? (
        <iframe
          src={currentSource.url}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media"
          referrerPolicy="unsafe-url"
          title={`${title} - Episode ${episode}`}
        />
      ) : (
        <video
          ref={videoRef}
          src={adPlaying || midRollPlaying ? adVideo : undefined}
          className="w-full h-full object-contain cursor-pointer"
          onClick={adPlaying || midRollPlaying ? undefined : togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMeta}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onError={handleError}
          autoPlay
          playsInline
        />
      )}

      {/* Fail state */}
      {allFailed && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h4 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Transmission Failed</h4>
          <p className="text-zinc-500 max-w-sm text-sm font-medium leading-relaxed mb-8">
            All primary and redundant streaming nodes have failed to establish a connection.
          </p>
          <button 
            onClick={() => { setSourceIndex(0); setAllFailed(false); setHasError(false); }}
            className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 uppercase tracking-widest text-xs"
          >
            Re-establish Link
          </button>
        </div>
      )}

      {/* Ad Overlays */}
      {(adPlaying || midRollPlaying) && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {midRollPlaying ? "Mid-roll Transmission" : "Pre-roll Advertisement"}
            </span>
          </div>

          <div className="absolute bottom-8 right-8 pointer-events-auto">
            <button
              onClick={adPlaying ? (adSkippable ? skipAd : undefined) : (midRollTimer <= 0 ? skipMidRoll : undefined)}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl flex items-center gap-3
                ${(adPlaying ? adSkippable : midRollTimer <= 0) 
                  ? "bg-white text-black hover:bg-zinc-200 shadow-white/10" 
                  : "bg-black/80 text-zinc-500 border border-white/5 backdrop-blur-xl"}`}
            >
              {adPlaying 
                ? (adTimer > 0 ? `Skip in ${adTimer}s` : "Proceed to Content") 
                : (midRollTimer > 0 ? `Resuming in ${midRollTimer}s` : "Skip Ad")}
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom UI: Video only */}
      {currentSource?.type !== "iframe" && !adPlaying && !midRollPlaying && (
        <>
          {/* Top Info */}
          <div 
            className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-500"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Episode {episode} • {currentSource.label}</p>
            </div>
            
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/5 transition-all text-white">
                <Settings className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/5 transition-all text-white">
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-8 space-y-6 pt-20 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-500"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            <div className="space-y-4">
              {/* Progress */}
              <div 
                className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer group/seek transition-all hover:h-2"
                onClick={seek}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-600 rounded-full pointer-events-none transition-all group-hover/seek:bg-blue-400"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl scale-0 group-hover/seek:scale-100 transition-transform flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all transform active:scale-90">
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                  </button>

                  {onNext && (
                    <button onClick={onNext} className="text-zinc-500 hover:text-white transition-all transform active:scale-90">
                      <SkipForward className="w-6 h-6 fill-current" />
                    </button>
                  )}

                  <div className="flex items-center gap-4 group/vol">
                    <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-all">
                      {(muted || volume === 0) ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                        setMuted(v === 0);
                      }}
                      className="w-0 group-hover/vol:w-24 transition-all opacity-0 group-hover/vol:opacity-100 h-1 bg-white/10 rounded-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <span className="text-xs font-black text-white font-mono tracking-tighter">
                    {fmt(currentTime)} <span className="text-zinc-700 mx-2">/</span> {fmt(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)} className="text-zinc-500 hover:text-white transition-all">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-zinc-500 hover:text-white transition-all transform active:scale-90">
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Host Switcher (iframes) */}
      {currentSource?.type === "iframe" && !adPlaying && !midRollPlaying && (
        <div className="absolute top-8 left-8 z-20 flex flex-wrap gap-2 group/hosts">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-3xl border border-white/5 p-3 rounded-2xl opacity-50 group-hover/hosts:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-2 px-2 border-r border-white/10 mr-2">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Servers</span>
            </div>
            {sources.map((s, i) => (
              <button
                key={i}
                onClick={() => { setSourceIndex(i); setHasError(false); setAllFailed(false); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${i === sourceIndex ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-500 hover:text-white"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
