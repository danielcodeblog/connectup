import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Loader2, Volume2, VolumeX, AlertCircle } from 'lucide-react';

// Global tracking for user interactions to unlock audio
let globalUserHasInteracted = false;
const activeVideoElementsSet = new Set<HTMLVideoElement>();
const activeVideoPlayersCallbacks = new Set<() => void>();

if (typeof window !== 'undefined') {
  const triggerGlobalUnmute = () => {
    if (globalUserHasInteracted) return;
    console.log("Global user interaction detected. Unmuting active videos synchronously...");
    globalUserHasInteracted = true;

    // Direct synchronous unmuting of active videos
    activeVideoElementsSet.forEach(video => {
      try {
        video.muted = false;
        // Ensure play is resumed unmuted
        video.play().catch(err => {
          console.warn("Play failed on interaction-based unmute:", err.message);
        });
      } catch (err) {
        console.error("Failed to unmute video synchronously:", err);
      }
    });

    // Notify React components to update state
    activeVideoPlayersCallbacks.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error("Failed to call React unmute callback:", err);
      }
    });
  };

  // Register typical interaction events to catch any screen activity immediately
  window.addEventListener('click', triggerGlobalUnmute, { capture: true, passive: true });
  window.addEventListener('pointerdown', triggerGlobalUnmute, { capture: true, passive: true });
  window.addEventListener('touchstart', triggerGlobalUnmute, { capture: true, passive: true });
  window.addEventListener('keydown', triggerGlobalUnmute, { capture: true, passive: true });
  window.addEventListener('mousedown', triggerGlobalUnmute, { capture: true, passive: true });
  window.addEventListener('dragstart', triggerGlobalUnmute, { capture: true, passive: true });
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  playing?: boolean;
  loop?: boolean;
  muted?: boolean;
  onLoadedData?: () => void;
  preload?: 'none' | 'metadata' | 'auto';
  controls?: boolean;
  disableIntersectionObserver?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onMuteChange?: (muted: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  src, 
  poster,
  className = '', 
  autoPlay = false, 
  playing,
  loop = false, 
  muted = false, 
  onLoadedData,
  preload = 'auto',
  controls = false,
  disableIntersectionObserver = false,
  onPlayingChange,
  onMuteChange
}) => {
  const [isPlaying, setIsPlaying] = useState(playing !== undefined ? playing : autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const prevMutedRef = useRef(muted);
  
  useEffect(() => {
      if (prevMutedRef.current && !muted) {
         // Rewind to start when unmuting pitch videos
         if (playerRef.current) {
            playerRef.current.currentTime = 0;
         }
      }
      prevMutedRef.current = muted;
      setIsMuted(muted || !globalUserHasInteracted);
  }, [muted]);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    
    const video = playerRef.current;
    if (!video) return;

    // Apply muted property directly to DOM element (crucial for React + browser autoplay rules)
    video.muted = isMuted;
    video.volume = volume;

    if (isPlaying) {
      if (!video.paused) return;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;
        playPromise.then(() => {
          playPromiseRef.current = null;
        }).catch(error => {
          playPromiseRef.current = null;
          if (error.name === 'AbortError') {
             console.log("Video play aborted (temporary source switch/buffer transition):", src);
             return; // Do not turn off isPlaying
          }
          if (error.name === 'NotAllowedError') {
             console.warn("Autoplay blocked by browser policy, retrying muted so it plays automatically...");
             setIsMuted(true);
             video.muted = true;
             video.play().catch(err => {
               console.error("Muted autoplay failed as well:", err);
               setIsPlaying(false);
             });
          } else {
             console.error("Playback failed:", error);
          }
        });
      }
    } else {
      if (video.paused) return;
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          video.pause();
        }).catch(() => {
          video.pause();
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, isMuted, src]);

  // Register active video element and callback for global unmute events
  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;

    activeVideoElementsSet.add(video);

    const onUnmuteCallback = () => {
      setIsMuted(false);
    };
    activeVideoPlayersCallbacks.add(onUnmuteCallback);

    // If global interaction has already happened, ensure we reflect the state and unmute
    if (globalUserHasInteracted && !muted) {
      setIsMuted(false);
      video.muted = false;
    }

    return () => {
      activeVideoElementsSet.delete(video);
      activeVideoPlayersCallbacks.delete(onUnmuteCallback);
    };
  }, [src, muted]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      const video = playerRef.current;
      if (video) {
        video.pause();
        video.src = "";
        try {
           video.load();
        } catch (e) {
           // Ignore load error during unmount
        }
      }
      setIsPlaying(false);
    };
  }, []);

  // --- INTERSECTION OBSERVER (Performance) ---
  useEffect(() => {
    if (disableIntersectionObserver) return;

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
  }, [autoPlay, disableIntersectionObserver]);

  // Sync autoPlay and playing prop changes directly to isPlaying state
  useEffect(() => {
    const targetPlaying = playing !== undefined ? playing : autoPlay;
    console.log(`VideoPlayer: targetPlaying changed: ${targetPlaying} for ${src}`);
    setIsPlaying(targetPlaying);
  }, [autoPlay, playing, src]);

  // Only load the video when the actual source URL changes, preserving buffering for the same source
  useEffect(() => {
    setHasError(false);
    if (playerRef.current) {
        playerRef.current.load();
        // Keep playing if intended
        if (isPlaying) {
          playerRef.current.muted = isMuted;
          playerRef.current.play().catch(() => {});
        }
    }
  }, [src]);

  // --- HANDLERS ---
  const togglePlay = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    e?.stopPropagation();
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (onPlayingChange) {
      onPlayingChange(nextPlaying);
    }
    if (controls) showControlsTemporarily();
  }, [isPlaying, controls, onPlayingChange]);

  const toggleMute = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (onMuteChange) {
      onMuteChange(nextMuted);
    }
    if (controls) showControlsTemporarily();
  }, [isMuted, controls, onMuteChange]);

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
      onClick={playing !== undefined ? undefined : togglePlay}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={playerRef}
        src={src}
        preload={preload}
        muted={isMuted}
        playsInline
        loop={loop}
        autoPlay={autoPlay}
        crossOrigin="anonymous"
        className={`w-full h-full ${className.includes('object-cover') ? 'object-cover' : 'object-contain'} transition-opacity duration-300 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onLoadedMetadata={() => {
            if (isPlaying && playerRef.current) {
                playerRef.current.play().catch(e => console.error("Autoplay failed:", e));
            }
        }}
        onLoadStart={() => console.log('Video load start:', src)}
        onWaiting={() => setIsBuffering(true)}
        onError={(e) => {
            const video = e.currentTarget;
            console.error('Video error:', video.error?.message, 'src:', src, 'error code:', video.error?.code);
            setIsBuffering(false);
            setHasError(true);
        }}
        onPlaying={() => { 
            if (isMounted.current) { 
                setIsBuffering(false); 
                setHasStarted(true); 
            } 
        }}
        onPlay={() => {
            if (isMounted.current) {
                setHasStarted(true);
                setIsBuffering(false);
            }
        }}
        onEnded={() => {
            if (playerRef.current) {
                playerRef.current.currentTime = 0;
                if (loop) {
                  playerRef.current.play().catch(() => {});
                } else {
                  setIsPlaying(false);
                }
            }
        }}
      />
      
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900 text-white p-4 text-center">
           {poster ? (
             <img src={poster} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
           ) : (
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 border border-white/10">
               <AlertCircle size={24} className="text-zinc-500" />
             </div>
           )}
           <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Preview Unavailable</span>
        </div>
      )}
      
      {poster && !hasStarted && !hasError && (
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

      {/* Always-on TikTok Style thin top progress bar */}
      {controls && (
        <div 
          className={`absolute top-0 left-0 right-0 h-[3px] bg-white/20 transition-all duration-300 z-10 pointer-events-none ${
            showControls ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'
          }`}
        >
          <div 
            className="h-full bg-brand-primary transition-all duration-75" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {controls && (
        <div 
            className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-14 pb-12 px-4 transition-all duration-300 flex items-center gap-3 z-20 pointer-events-auto ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
        >
            <button 
                onClick={togglePlay} 
                onPointerDown={(e) => e.stopPropagation()}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-brand-primary transition-colors bg-white/10 rounded-full hover:bg-white/20 shadow-sm shrink-0"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Custom TikTok Style Scrubbable Seek Bar */}
            <div className="relative flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer group/seek flex items-center">
                <div 
                    className="absolute top-0 left-0 h-full bg-brand-primary rounded-full transition-all duration-75" 
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress} 
                    onChange={handleSeek}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                    className="absolute w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/seek:scale-100 transition-transform pointer-events-none"
                    style={{ left: `calc(${progress}% - 6px)` }}
                />
            </div>
        </div>
      )}
    </div>
  );
});
