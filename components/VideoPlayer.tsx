import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onLoadedData?: () => void;
  preload?: 'none' | 'metadata' | 'auto';
  controls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  src, 
  poster,
  className = '', 
  autoPlay = false, 
  loop = true, 
  muted = true, 
  onLoadedData,
  preload = 'auto',
  controls = false
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.pause === 'function') {
            playerRef.current.pause();
          }
          playerRef.current.removeAttribute('src');
          playerRef.current.load();
        } catch (e) {
          // Ignore errors during unmount cleanup
        }
      }
      setIsPlaying(false);
    };
  }, []);

  // --- INTERSECTION OBSERVER (Performance) ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlayingRef.current) {
             setIsPlaying(false);
          } else if (entry.isIntersecting && autoPlay && !isPlayingRef.current) {
             setIsPlaying(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoPlay]);

  useEffect(() => {
    setHasStarted(false);
    if (autoPlay) setIsPlaying(true);
  }, [src, autoPlay]);

  // --- HANDLERS ---
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
    if (controls) showControlsTemporarily();
  }, [isPlaying, controls]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isMounted.current) return;
    const current = e.currentTarget.currentTime;
    setCurrentTime(current);
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
    setIsBuffering(false);
    if (current > 0) setHasStarted(true);
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isMounted.current) return;
    const dur = e.currentTarget.duration;
    setDuration(dur);
    if (onLoadedData) onLoadedData();
    setIsBuffering(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const time = (val / 100) * duration;
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
    setProgress(val);
    setCurrentTime(time);
  };

  const showControlsTemporarily = () => {
    if (!controls) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
       if (isPlaying) setShowControls(false);
    }, 2000);
  };

  const handleMouseMove = () => {
      if (controls) showControlsTemporarily();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black overflow-hidden select-none ${className}`}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <ReactPlayer
        ref={playerRef}
        src={src || undefined}
        playing={isPlaying}
        loop={loop}
        muted={muted}
        playsInline
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, objectFit: className.includes('object-cover') ? 'cover' : 'contain' }}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { if (isMounted.current) { setIsBuffering(false); setHasStarted(true); setIsPlaying(true); } }}
        onPause={() => { if (isMounted.current) setIsPlaying(false); }}
      />
      
      {poster && !hasStarted && (
        <img 
          src={poster} 
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
          alt="" 
        />
      )}

      {isBuffering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none transition-all duration-300">
           <div className="relative">
               <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
               <Loader2 className="w-10 h-10 text-brand-primary animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(255,208,0,0.6)]" />
           </div>
        </div>
      )}

      {controls && (
        <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="relative w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/seek">
                <div 
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-150" 
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress} 
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                    className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-sm opacity-0 group-hover/seek:opacity-100 pointer-events-none transition-opacity"
                    style={{ left: `${progress}%` }}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlay} 
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    
                    <span className="text-[10px] font-mono font-medium text-white/80 tracking-wide">
                        {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
});

