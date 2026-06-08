import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Maximize, SkipForward, Info, RotateCcw } from "lucide-react";
import { VideoSource } from "@/lib/video-resolver";


interface VideoPlayerProps {
  sources: VideoSource[];
  onAdComplete?: () => void;
}

export default function VideoPlayer({ sources, onAdComplete }: VideoPlayerProps) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAdPlaying, setIsAdPlaying] = useState(true);
  const [adTimer, setAdTimer] = useState(5);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSource = sources[currentSourceIndex];


  useEffect(() => {
    if (isAdPlaying && adTimer > 0) {
      const timer = setInterval(() => setAdTimer((t: number) => t - 1), 1000);
      return () => clearInterval(timer);
    }

  }, [isAdPlaying, adTimer]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleVideoError = () => {
    if (currentSourceIndex < sources.length - 1) {
        console.log(`Source ${currentSource.label} failed. Trying fallback...`);
        setCurrentSourceIndex((prev: number) => prev + 1);
        setHasError(false);
    } else {

        setHasError(true);
    }
  };

  const skipAd = () => {
    setIsAdPlaying(false);
    if (onAdComplete) onAdComplete();
  };


  return (
    <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden group shadow-2xl border border-zinc-800">
      {currentSource.type === "iframe" && !isAdPlaying ? (
        <iframe 
            src={currentSource.url} 
            className="w-full h-full border-0" 
            allowFullScreen
        ></iframe>
      ) : (
        <video
          ref={videoRef}
          src={isAdPlaying ? "https://www.w3schools.com/html/mov_bbb.mp4" : currentSource.url}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          autoPlay
        />
      )}

      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-zinc-950/90 text-center">
            <RotateCcw className="w-12 h-12 text-zinc-500 mb-4 animate-spin-slow" />
            <h4 className="text-xl font-black text-white">Playback Error</h4>
            <p className="text-zinc-500 max-w-xs mt-2">All 7 fallback hosts have failed to respond. Please try again later.</p>
        </div>
      )}


      {/* Ad Overlay */}
      {isAdPlaying && (
        <div className="absolute inset-0 z-20 flex flex-col items-end justify-end p-8 bg-black/20 pointer-events-none">
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Advertisement</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <button
              onClick={skipAd}
              disabled={adTimer > 0}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${adTimer > 0 ? 'bg-black/60 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
            >
              {adTimer > 0 ? `Skip in ${adTimer}s` : 'Skip Advertisement'}
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Controls (Simplified for aesthetic) */}
      {!isAdPlaying && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="p-8 space-y-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
              <div className="h-full bg-blue-600 transition-all duration-100" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-colors">
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>
                <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-white" />
                    <div className="w-24 h-1 bg-white/20 rounded-full"><div className="w-2/3 h-full bg-white rounded-full"></div></div>
                </div>
                <span className="text-sm font-bold text-zinc-400">00:42 / 24:00</span>
              </div>

              <div className="flex items-center gap-6">
                <button className="text-white hover:text-blue-500 transition-colors"><Info className="w-6 h-6" /></button>
                <button className="text-white hover:text-blue-500 transition-colors"><Maximize className="w-6 h-6" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
